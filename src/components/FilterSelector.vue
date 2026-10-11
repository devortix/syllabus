<template>
  <div class="filter-container">
    <!-- Action Sheets for each selection level -->
    <van-action-sheet
      v-model:show="showYearSheet"
      title="Оберіть рік навчання"
      :actions="yearActions"
      cancel-text=""
      @select="onYearSelect"
    />

    <van-action-sheet
      v-model:show="showFacultySheet"
      :title="`Оберіть факультет (${selectedYear})`"
      :actions="facultyActions"
      :cancel-text="`< ${selectedYear}`"
      @select="onFacultySelect"
      @cancel="goBack('faculty')"
    />

    <van-action-sheet
      v-model:show="showCourseSheet"
      :title="`Оберіть курс (${getFacultyTitle(selectedFaculty)})`"
      :actions="courseActions"
      :cancel-text="`< ${getFacultyTitle(selectedFaculty)}`"
      @select="onCourseSelect"
      @cancel="goBack('course')"
    />

    <van-action-sheet
      v-model:show="showGroupSheet"
      :title="`Оберіть спеціальність (${getCourseTitle(selectedCourse)})`"
      :actions="groupActions"
      :cancel-text="`< ${getCourseTitle(selectedCourse)}`"
      @select="onGroupSelect"
      @cancel="goBack('group')"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ActionSheet, Toast } from 'vant';
import scheduleRepository from '@/services/scheduleRepository.js';

const emit = defineEmits(['filters-selected', 'open']);

// State
const allFilters = ref([]);
const showYearSheet = ref(false);
const showFacultySheet = ref(false);
const showCourseSheet = ref(false);
const showGroupSheet = ref(false);

const selectedYear = ref(null);
const selectedFaculty = ref(null);
const selectedCourse = ref(null);
const selectedGroup = ref(null);

const availableYears = [2026, 2027];

// Computed properties
const yearActions = computed(() => {
  return availableYears.map(year => ({
    name: year.toString(),
    value: year
  }));
});

const faculties = computed(() => {
  if (!selectedYear.value) return [];
  return allFilters.value;
});

const facultyActions = computed(() => {
  return faculties.value.map(faculty => ({
    name: faculty.title,
    value: faculty.code
  }));
});

const courses = computed(() => {
  if (!selectedFaculty.value) return [];
  const faculty = faculties.value.find(f => f.code === selectedFaculty.value);
  return faculty ? faculty.data : [];
});

const courseActions = computed(() => {
  return courses.value.map(course => ({
    name: course.title,
    value: course.code
  }));
});

const groups = computed(() => {
  if (!selectedCourse.value) return [];
  const course = courses.value.find(c => c.code === selectedCourse.value);
  return course ? course.data : [];
});

const groupActions = computed(() => {
  return groups.value.map(group => ({
    name: group.title,
    value: group.code
  }));
});

// Methods
const loadFilters = async () => {
  try {
    const filters = await scheduleRepository.getFilters(2026);
    allFilters.value = filters;
  } catch (error) {
    Toast.fail('Не вдалося завантажити фільтри');
    console.error(error);
  }
};

const getFacultyTitle = (code) => {
  const faculty = faculties.value.find(f => f.code === code);
  return faculty ? faculty.title : '';
};

const getCourseTitle = (code) => {
  const course = courses.value.find(c => c.code === code);
  return course ? course.title : '';
};

const onYearSelect = (action) => {
  selectedYear.value = action.value;
  showYearSheet.value = false;
  showFacultySheet.value = true;
};

const onFacultySelect = (action) => {
  selectedFaculty.value = action.value;
  showFacultySheet.value = false;
  showCourseSheet.value = true;
};

const onCourseSelect = (action) => {
  selectedCourse.value = action.value;
  showCourseSheet.value = false;
  showGroupSheet.value = true;
};

const onGroupSelect = (action) => {
  selectedGroup.value = action.value;
  showGroupSheet.value = false;
  
  emit('filters-selected', {
    year: selectedYear.value,
    faculty: selectedFaculty.value,
    course: selectedCourse.value,
    group: selectedGroup.value
  });
  
  resetSelection();
};

const goBack = (level) => {
  if (level === 'faculty') {
    selectedFaculty.value = null;
    selectedCourse.value = null;
    selectedGroup.value = null;
    showFacultySheet.value = false;
    showYearSheet.value = true;
  } else if (level === 'course') {
    selectedCourse.value = null;
    selectedGroup.value = null;
    showCourseSheet.value = false;
    showFacultySheet.value = true;
  } else if (level === 'group') {
    selectedGroup.value = null;
    showGroupSheet.value = false;
    showCourseSheet.value = true;
  }
};

const resetSelection = () => {
  selectedYear.value = null;
  selectedFaculty.value = null;
  selectedCourse.value = null;
  selectedGroup.value = null;
};

const openPicker = () => {
  showYearSheet.value = true;
};

onMounted(() => {
  loadFilters();
});

defineExpose({
  openPicker
});
</script>

<style scoped>
.filter-container {
  display: none;
}
</style>
