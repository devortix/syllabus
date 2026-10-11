<template>
    <div class="schedule-container">
        <!-- Schedule Info Section -->
        <div class="schedule-info-section" v-if="scheduleData">
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Факультет:</span>
                    <span class="info-value">{{ facultyTitle }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Група:</span>
                    <span class="info-value">{{ groupTitle }}</span>
                </div>
                <div class="info-row info-link-row">
                    <a href="#" @click.prevent="showLinkDialog = true" class="schedule-link">
                        <van-icon name="link" size="16"/>
                        Посилання на розклад
                    </a>
                </div>
            </div>
        </div>

        <!-- Schedule Link ShareSheet with Link Display -->
        <van-popup
            v-model:show="showLinkDialog"
            position="bottom"
            class="link-popup"
        >
            <div class="link-popup-content">
                <div class="link-popup-header">
                    <h3>Поділитися розкладом</h3>
                    <van-icon name="cross" size="24" @click="showLinkDialog = false" class="close-icon"/>
                </div>
                
                <div class="link-display-section">
                    <div class="link-text">{{ scheduleLink }}</div>
                    <button @click="copyScheduleLink" class="copy-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Копіювати
                    </button>
                </div>
            </div>
        </van-popup>

        <!-- Week Swipe Navigation -->
        <div class="week-swipe-container sticky">
            <van-icon
                name="arrow-left"
                size="20"
                class="swipe-arrow swipe-arrow-left"
                @click="handlePrevWeek"
            />
            <van-swipe
                ref="swipeRef"
                :active="currentSwipeIndex"
                @change="onSwipeChange"
                class="week-swipe"
                :show-indicators="false"
            >
                <van-swipe-item class="week-item">
                    <div class="week-header">
                        <div class="week-dates">{{weekInfo.display}}</div>
                        <div class="week-parity">{{weekInfo.parityDisplay}}</div>
                    </div>
                </van-swipe-item>

                <van-swipe-item class="week-item">
                    <div class="week-header">
                        <div class="week-dates">{{nextWeekInfo.display}}</div>
                        <div class="week-parity">{{nextWeekInfo.parityDisplay}}</div>
                    </div>
                </van-swipe-item>
            </van-swipe>
            <van-icon
                name="arrow"
                size="20"
                class="swipe-arrow swipe-arrow-right"
                @click="handleNextWeek"
            />
        </div>

        <!-- Schedule Table -->
        <div class="schedule-table-wrapper" :key="`${filters.year}_${filters.semester}_${filters.faculty}_${filters.course}_${filters.group}`">
            <table class="schedule-table" v-if="scheduleData && scheduleData[currentParity]">
                <tbody>
                <template v-for="day in days" :key="day.code">
                    <tr class="day-header">
                        <td colspan="2">{{day.name}}</td>
                    </tr>

                    <tr
                        v-for="lessonSlot in getFullDaySchedule(currentParity, day.code)"
                        :key="`${currentParity}-${day.code}-${lessonSlot.number}`"
                        class="lesson-row"
                    >
                        <td class="lesson-time">
                            <div class="lesson-time-inner">
                                <div class="time-start">{{lessonSlot.timeStart}}</div>
                                <div class="time-end">{{lessonSlot.timeEnd}}</div>
                            </div>
                        </td>
                        <td class="lesson-info" v-if="lessonSlot.lesson">
                            <div class="lesson-title">{{lessonSlot.lesson.title}}</div>
                            <div class="lesson-teacher">{{lessonSlot.lesson.teacher}}</div>
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
    </div>
</template>

<script setup>
import {computed, onMounted, ref, watch, nextTick} from 'vue';
import {showNotify} from 'vant';
import scheduleRepository from '@/services/scheduleRepository.js';
import WeekParityCalculator from '@/services/weekParityCalculator.js';
import { config } from '@/config.js';

const props = defineProps({
    filters: {
        type: Object,
        required: true
    },
    facultyTitle: {
        type: String,
        default: ''
    },
    groupTitle: {
        type: String,
        default: ''
    }
});

// State
const scheduleData = ref(null);
const currentSwipeIndex = ref(0);
const showLinkDialog = ref(false);
const swipeRef = ref(null);

const days = [
    {code: '1', name: 'Понеділок'},
    {code: '2', name: 'Вівторок'},
    {code: '3', name: 'Середа'},
    {code: '4', name: 'Четвер'},
    {code: '5', name: 'П\'ятниця'},
    {code: '6', name: 'Субота'}
];

// Lesson times
const lessonTimes = {
    1: {start: '8.00', end: '9.20'},
    2: {start: '9.40', end: '11.00'},
    3: {start: '11.20', end: '12.40'},
    4: {start: '13.00', end: '14.20'},
    5: {start: '14.40', end: '16.00'}
};

// Computed
const weekInfo = computed(() => {
    return WeekParityCalculator.getCurrentWeekRange();
});

const nextWeekInfo = computed(() => {
    return WeekParityCalculator.getNextWeekRange();
});

const currentParity = computed(() => {
    return currentSwipeIndex.value === 0 ? weekInfo.value.parity : nextWeekInfo.value.parity;
});

const currentWeekDisplay = computed(() => {
    return currentSwipeIndex.value === 0 ? weekInfo.value.display : nextWeekInfo.value.display;
});

const scheduleLink = computed(() => {
    if (!props.filters) return '';
    const {year, semester, faculty, course, group} = props.filters;
    return `${config.scheduleDomain}?startapp=${year}_${semester}_${faculty}_${course}_${group}`;
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
                title: lessonData.title,
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

const onSwipeChange = (index) => {
    currentSwipeIndex.value = index;
    console.log('Swipe changed to index:', index);
    console.log('Current parity:', currentParity.value);
};

const handlePrevWeek = () => {
    if (swipeRef.value && currentSwipeIndex.value > 0) {
        swipeRef.value.swipeTo(0);
    }
};

const handleNextWeek = () => {
    if (swipeRef.value && currentSwipeIndex.value < 1) {
        swipeRef.value.swipeTo(1);
    }
};

const copyScheduleLink = async () => {
    try {
        await navigator.clipboard.writeText(scheduleLink.value);
        showLinkDialog.value = false;
        showNotify({
            type: 'success',
            message: 'Посилання скопійовано',
            duration: 2000
        });
    } catch (error) {
        showNotify({
            type: 'danger',
            message: 'Помилка при копіюванні',
            duration: 2000
        });
        console.error(error);
    }
};

const getFacultyTitle = (facultyCode) => {
    return props.facultyTitle;
};

const getGroupTitle = (groupCode) => {
    return props.groupTitle;
};

const loadSchedule = async () => {
    try {
        // Clear previous schedule data before loading new one
        scheduleData.value = null;
        
        scheduleData.value = await scheduleRepository.getSchedule(
            props.filters.year,
            props.filters.semester,
            props.filters.faculty,
            props.filters.course,
            props.filters.group
        );

        // Set active swipe index to 0 (current week)
        currentSwipeIndex.value = 0;
        
        // Force swipe to recalculate dimensions after DOM updates
        await nextTick();
        if (swipeRef.value) {
            swipeRef.value.resize();
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        // Ensure data is cleared on error
        scheduleData.value = null;
    }
};

onMounted(async () => {
    await loadSchedule();
    
    // Additional resize to ensure proper initialization
    await nextTick();
    setTimeout(() => {
        if (swipeRef.value) {
            swipeRef.value.resize();
        }
    }, 100);
});

watch(
    () => currentSwipeIndex.value,
    (newIndex) => {
        console.log('Swipe index changed to:', newIndex);
        console.log('Current parity:', currentParity.value);
    }
);

watch(
    () => props.filters,
    () => {
        loadSchedule();
    },
    {deep: true}
);
</script>

<style scoped>
.schedule-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: #f5f5f5;
    min-height: 100vh;
}

.schedule-info-section {
    background: white;
    padding: 12px 14px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.info-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.info-label {
    font-size: 11px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-value {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    line-height: 1.3;
}

.info-link-row {
    border-top: 1px solid #e0e0e0;
    padding-top: 10px;
    margin-top: 4px;
}

.schedule-link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #1989fa;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: opacity 0.2s;
}

.schedule-link:active {
    opacity: 0.7;
}

.week-header {

    padding: 5px;
    width: 100%;
    text-align: center;

}

.week-dates {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
}

.week-parity {
    font-size: 14px;
    color: #1989fa;
    font-weight: 500;
}

:deep(.van-swipe) {
    margin-bottom: 0;
}

.week-swipe-container {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 12px 8px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.week-swipe-container.sticky {
    position: sticky;
    top: 0;
    z-index: 100;
}


.week-item {
    padding: 0;
}

.swipe-arrow {
    cursor: pointer;
    color: #1989fa;
    flex-shrink: 0;
    transition: opacity 0.2s;
}

.swipe-arrow:active {
    opacity: 0.7;
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
    animation: fadeIn 0.6s ease;
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


.lesson-info {
    padding: 7px 12px;
    min-height: 50px;
}

.lesson-info.empty {
    background: #f9f9f9;
}

.lesson-title {
    font-weight: 600;
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

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.lesson-row {
    animation: fadeInRow 0.8s ease;
}

@keyframes fadeInRow {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Animations for table transitions */
.fade-list-enter-active,
.fade-list-leave-active {
    transition: all 0.3s ease;
}

.fade-list-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-list-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-list-move {
    transition: transform 0.3s ease;
}

.link-popup {
    --van-popup-background: white;
}

.link-popup-content {
    padding: 20px;
    border-radius: 12px 12px 0 0;
}

.link-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.link-popup-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.close-icon {
    cursor: pointer;
    color: #999;
    transition: color 0.2s;
}

.close-icon:active {
    color: #666;
}

.link-display-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.link-text {
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;
    font-size: 12px;
    font-family: monospace;
    color: #666;
    word-break: break-all;
    line-height: 1.5;
    border: 1px solid #e0e0e0;
}

.copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: #1989fa;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}

.copy-button:active {
    background: #0f6ec4;
}

.copy-button svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
}
</style>
