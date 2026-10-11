<template>
  <div class="schedule-container">
    <!-- Schedule Link Section -->
    <div class="schedule-link-section" v-if="scheduleData">
      <div class="schedule-link-content">
        <van-icon name="link" size="18" />
        <span>Посилання на розклад</span>
      </div>
      <van-icon name="arrow" size="20" @click="showLinkDialog = true" class="link-arrow" />
    </div>

    <!-- Schedule Link Dialog -->
    <van-dialog
      v-model:show="showLinkDialog"
      title="Посилання на розклад"
      show-cancel-button
      confirm-button-text="Скопіювати посилання"
      @confirm="copyScheduleLink"
    >
      <div class="link-dialog-content">
        <div class="link-input">
          <input type="text" :value="scheduleLink" readonly />
        </div>
      </div>
    </van-dialog>

    <!-- Week Header -->
    <div class="week-header">
      <div class="week-dates">{{ weekInfo.display }}</div>
      <div class="week-parity">{{ weekInfo.parityDisplay }}</div>
    </div>

    <!-- Parity Toggle using Tabs -->
    <van-tabs
      v-model:active="activeTab"
      @change="onTabChange"
      color="#1989fa"
    >
      <van-tab title="чисельник" name="first">
        <div class="schedule-table-wrapper">
          <table class="schedule-table" v-if="scheduleData && scheduleData.first">
            <tbody>
              <template v-for="day in days" :key="day.code">
                <tr class="day-header">
                  <td colspan="2">{{ day.name }}</td>
                </tr>
                
                <tr v-for="lessonSlot in getFullDaySchedule('first', day.code)" :key="`first-${day.code}-${lessonSlot.number}`" class="lesson-row">
                  <td class="lesson-time">
                      <div class="lesson-time-inner">
                        <div class="time-start">{{ lessonSlot.timeStart }}</div>
                        <div class="time-end">{{ lessonSlot.timeEnd }}</div>
                      </div>
                  </td>
                  <td class="lesson-info" v-if="lessonSlot.lesson">
                    <div class="lesson-short">{{ lessonSlot.lesson.short }}</div>
                    <div class="lesson-teacher">{{ lessonSlot.lesson.teacher }}</div>
                  </td>
                  <td class="lesson-info empty" v-else></td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else class="no-schedule">
            <p>Розклад не завантажено</p>
          </div>
        </div>
      </van-tab>

      <van-tab title="знаменник" name="second">
        <div class="schedule-table-wrapper">
          <table class="schedule-table" v-if="scheduleData && scheduleData.second">
            <tbody>
              <template v-for="day in days" :key="day.code">
                <tr class="day-header">
                  <td colspan="2">{{ day.name }}</td>
                </tr>
                
                <tr v-for="lessonSlot in getFullDaySchedule('second', day.code)" :key="`second-${day.code}-${lessonSlot.number}`" class="lesson-row">
                  <td class="lesson-time">
                      <div class="lesson-time-inner">
                        <div class="time-start">{{ lessonSlot.timeStart }}</div>
                        <div class="time-end">{{ lessonSlot.timeEnd }}</div>
                      </div>
                  </td>
                  <td class="lesson-info" v-if="lessonSlot.lesson">
                    <div class="lesson-short">{{ lessonSlot.lesson.short }}</div>
                    <div class="lesson-teacher">{{ lessonSlot.lesson.teacher }}</div>
                  </td>
                  <td class="lesson-info empty" v-else></td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else class="no-schedule">
            <p>Розклад не завантажено</p>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Tabs, Tab, Dialog, Button, Icon } from 'vant';
import { Toast } from 'vant';
import scheduleRepository from '@/services/scheduleRepository.js';
import WeekParityCalculator from '@/services/weekParityCalculator.js';

const props = defineProps({
  filters: {
    type: Object,
    required: true
  }
});

// State
const scheduleData = ref(null);
const activeTab = ref('first');
const showLinkDialog = ref(false);

const days = [
  { code: '1', name: 'Понеділок' },
  { code: '2', name: 'Вівторок' },
  { code: '3', name: 'Середа' },
  { code: '4', name: 'Четвер' },
  { code: '5', name: 'П\'ятниця' },
  { code: '6', name: 'Субота' }
];

// Lesson times
const lessonTimes = {
  1: { start: '8.00', end: '9.40' },
  2: { start: '9.40', end: '11.00' },
  3: { start: '11.20', end: '12.40' },
  4: { start: '13.00', end: '14.20' },
  5: { start: '14.40', end: '16.00' }
};

// Computed
const weekInfo = computed(() => {
  return WeekParityCalculator.getCurrentWeekRange();
});

const scheduleLink = computed(() => {
  if (!props.filters) return '';
  const { year, faculty, course, group } = props.filters;
  return `${window.location.origin}${window.location.pathname}?startapp=${year},${faculty},${course},${group}`;
});

// Methods
const getLessonsForDay = (parity, dayCode) => {
  if (!scheduleData.value || !scheduleData.value[parity]) {
    return [];
  }

  const dayLessons = [];
  const parityData = scheduleData.value[parity];

  for (const key in parityData) {
    if (key.startsWith(dayCode + '_')) {
      const lessonData = parityData[key];
      const lessonNumber = parseInt(key.split('_')[1]);
      dayLessons.push({
        number: lessonNumber,
        short: lessonData.short,
        teacher: lessonData.teacher
      });
    }
  }

  return dayLessons.sort((a, b) => a.number - b.number);
};

const getFullDaySchedule = (parity, dayCode) => {
  const lessons = getLessonsForDay(parity, dayCode);
  
  if (lessons.length === 0) {
    return [];
  }

  // Find the maximum lesson number for this day
  const maxLesson = Math.max(...lessons.map(l => l.number));

  // Create array for all lessons from 1 to maxLesson
  const fullSchedule = [];
  
  for (let i = 1; i <= maxLesson; i++) {
    const lesson = lessons.find(l => l.number === i);
    
    fullSchedule.push({
      number: i,
      timeStart: lessonTimes[i]?.start || '',
      timeEnd: lessonTimes[i]?.end || '',
      lesson: lesson || null
    });
  }

  return fullSchedule;
};

const onTabChange = () => {
  // Tab change is automatically handled by v-model:active
};

const copyScheduleLink = async () => {
  try {
    await navigator.clipboard.writeText(scheduleLink.value);
    showLinkDialog.value = false;
    Toast.success('Посилання скопійовано');
  } catch (error) {
    Toast.fail('Помилка при копіюванні');
    console.error(error);
  }
};

const loadSchedule = async () => {
  try {
    scheduleData.value = await scheduleRepository.getSchedule(
      props.filters.year,
      props.filters.faculty,
      props.filters.course,
      props.filters.group
    );
    
    // Set active tab based on current week parity
    activeTab.value = weekInfo.value.parity;
  } catch (error) {
    console.error('Error loading schedule:', error);
  }
};

onMounted(() => {
  loadSchedule();
});

watch(
  () => props.filters,
  () => {
    loadSchedule();
  },
  { deep: true }
);
</script>

<style scoped  >
.schedule-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.schedule-link-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.schedule-link-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1989fa;
  font-weight: 500;
}

.link-arrow {
  color: #999;
}

.link-dialog-content {
  padding: 16px 0;
}

.link-input {
  position: relative;
}

.link-input input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  background: #f9f9f9;
  color: #666;
}

.week-header {
  background: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.week-dates {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.week-parity {
  font-size: 14px;
  color: #1989fa;
  font-weight: 500;
}

:deep(.van-tabs) {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.van-tabs__nav) {
  background: white;
}

:deep(.van-tab) {
  padding: 16px;
}

.schedule-table-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.day-header {
  background: #f0f0f0;
  font-weight: bold;
  text-align: center;
  color: #333;
}

.day-header td {
  padding: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.lesson-row {
  border-bottom: 1px solid #e0e0e0;
}

.lesson-row:last-child {
  border-bottom: none;
}

.lesson-time {
  width: 60px;
  text-align: center;
  padding: 12px 8px;
  font-size: 12px;
  font-weight: 600;
  background: #f9f9f9;
  color: #666;
  border-right: 1px solid #e0e0e0;
  display: flex;
}

.lesson-time-inner {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 100%;
}

.time-start {
  margin-bottom: 10px;
}

.time-end {
  font-weight: normal;
}

.lesson-info {
  padding: 12px;
  min-height: 70px;
}

.lesson-info.empty {
  background: #f9f9f9;
}

.lesson-short {
  font-weight: bold;
  color: #1989fa;
  font-size: 14px;
  margin-bottom: 4px;
}

.lesson-teacher {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.empty-day {
  text-align: center;
  color: #999;
  padding: 16px;
}

.empty-day td {
  border-bottom: 1px solid #e0e0e0;
}

.no-schedule {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
</style>
