<template>
    <!-- Global Loader -->
    <div v-if="isLoading" class="global-loader">
        <div class="loader-spinner"></div>
        <p class="loader-text">Завантаження...</p>
    </div>

    <div id="app" class="app">
        <!-- Custom Navbar -->
        <div class="navbar">
            <div class="navbar-left">
                <span class="navbar-text" @click="handleSelectClick">Обрати</span>
            </div>
            <div class="navbar-center">
                <span class="navbar-title">Розклад</span>
            </div>
            <div class="navbar-right">
                <van-icon name="question-o" size="24" @click="showInfo = true"/>
            </div>
        </div>

        <!-- Info Popup -->
        <van-popup
            v-model:show="showInfo"
            position="bottom"
            class="info-popup"
        >
            <div class="info-popup-content">
                <div class="info-popup-header">
                    <h3>Про застосунок</h3>
                    <van-icon name="cross" size="24" @click="showInfo = false" class="close-icon"/>
                </div>

                <div class="info-body">
                    <div class="info-section">
                        <h4 class="info-title">Syllabus</h4>
                        <p class="info-description">Застосунок для зручного перегляду розкладу занять.</p>
                    </div>



                    <div class="info-section">
                        <h5 class="info-subtitle">Як додати розклад своєї групи?</h5>
                        <ol class="info-list">
                            <li>Заповніть Google-таблицю за
                                <a href="https://docs.google.com/spreadsheets/d/1Y1MIQ2U2FGKgveRW6le4URfkuPktsY3lfpvOXMauVm8/edit?usp=sharing" target="_blank" class="info-link">прикладом</a>.
                            </li>

                            <li>Надішліть посилання на заповнену таблицю
                                <a href="https://t.me/devopus13" target="_blank" class="info-link">@devopus13</a>.
                            </li>
                            <li>Вкажіть факультет, курс і групу.</li>
                        </ol>
                        <p class="info-note">Після цього розклад вашої групи можна буде додати до застосунку.</p>
                    </div>

                    <div class="info-section">
                        <h5 class="info-subtitle">Побажання та зауваження</h5>
                        <p class="info-text">
                            <a href="https://t.me/devopus13" target="_blank" class="info-link">@devopus13</a>
                        </p>
                    </div>
                </div>
            </div>
        </van-popup>

        <!-- Main Content -->
        <div class="app-content">
            <ScheduleView
                v-if="selectedFilters"
                :filters="selectedFilters"
                :faculty-title="getFacultyTitle(selectedFilters.faculty)"
                :group-title="getGroupTitle(selectedFilters.faculty, selectedFilters.course, selectedFilters.group)"
            />
            <div v-else class="empty-state">
                <div>
                    <p>Оберіть факультет і групу для перегляду розкладу</p>
                </div>

                <van-button
                    plain
                    type="primary"
                    size="large"
                    @click="handleSelectClick"
                    style="color: #1989fa; border: none;"
                >
                    обрати
                </van-button>

                <i class="text-hint">Щоб додати розклад своєї групи, скористайтеся
                    <a href="#" @click="showInfo = true">інструкцією</a></i>
            </div>
        </div>

        <!-- Year Selection ActionSheet -->
        <van-action-sheet
            v-model:show="showYearSheet"
            title="Обрати рік"
            :actions="yearActions"
            cancel-text=""
            @select="onYearSelect"
        />

        <!-- Semester Selection ActionSheet -->
        <van-action-sheet
            v-model:show="showSemesterSheet"
            title="Обрати семестр"
            :actions="semesterActions"
            :cancel-text="`< ${formattedYear}`"
            @select="onSemesterSelect"
            @cancel="goBack('semester')"
        />

        <!-- Faculty Selection ActionSheet -->
        <van-action-sheet
            v-model:show="showFacultySheet"
            title="Обрати факультет"
            :actions="facultyActions"
            :cancel-text="`< Семестр ${selectedSemester}`"
            @select="onFacultySelect"
            @cancel="goBack('faculty')"
        />

        <!-- Course Selection ActionSheet -->
        <van-action-sheet
            v-model:show="showCourseSheet"
            title="Обрати курс"
            :actions="courseActions"
            :cancel-text="`< ${getFacultyTitle(selectedFaculty)}`"
            @select="onCourseSelect"
            @cancel="goBack('course')"
        />

        <!-- Group Selection ActionSheet -->
        <van-action-sheet
            v-model:show="showGroupSheet"
            title="Обрати спеціальність"
            :actions="groupActions"
            :cancel-text="`< ${getCourseTitle(selectedCourse)}`"
            @select="onGroupSelect"
            @cancel="goBack('group')"
        />
    </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import {Toast} from 'vant';
import ScheduleView from '@/components/ScheduleView.vue';
import scheduleRepository from '@/services/scheduleRepository.js';

const showInfo = ref(false);
const selectedFilters = ref(null);
const isLoading = ref(true);

// Filter selector state
const allFilters = ref([]);
const showYearSheet = ref(false);
const showSemesterSheet = ref(false);
const showFacultySheet = ref(false);
const showCourseSheet = ref(false);
const showGroupSheet = ref(false);

const selectedYear = ref(null);
const selectedSemester = ref(null);
const selectedFaculty = ref(null);
const selectedCourse = ref(null);
const selectedGroup = ref(null);

const availableYears = [2026];

// Computed properties
const yearActions = computed(() => {
    return availableYears.map(year => ({
        name: `${year}р-${year + 1}р`,
        value: year
    }));
});

const formattedYear = computed(() => {
    return selectedYear.value ? `${selectedYear.value}р-${selectedYear.value + 1}р` : '';
});

const semesters = computed(() => {
    if (!selectedYear.value) return [];
    return allFilters.value;
});

const semesterActions = computed(() => {
    return semesters.value.map(semester => ({
        name: semester.title,
        value: semester.code
    }));
});

const faculties = computed(() => {
    if (!selectedSemester.value) return [];
    const semester = semesters.value.find(s => s.code === selectedSemester.value);
    return semester ? semester.data : [];
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

const getFacultyTitle = (facultyCode) => {
    // Search through all semesters to find the faculty
    for (const semester of allFilters.value) {
        const faculty = semester.data?.find(f => f.code === facultyCode);
        if (faculty) return faculty.title;
    }
    return '';
};

const getCourseTitle = (courseCode) => {
    // Search in current selected faculty's courses
    const faculty = faculties.value.find(f => f.code === selectedFaculty.value);
    if (!faculty) return '';
    const course = faculty.data.find(c => c.code === courseCode);
    return course ? course.title : '';
};

const getGroupTitle = (facultyCode, courseCode, groupCode) => {
    // Search through all semesters to find the faculty, course, and group
    for (const semester of allFilters.value) {
        const faculty = semester.data?.find(f => f.code === facultyCode);
        if (faculty) {
            const course = faculty.data?.find(c => c.code === courseCode);
            if (course) {
                const group = course.data?.find(g => g.code === groupCode);
                if (group) return group.title;
            }
        }
    }
    return '';
};

const handleSelectClick = () => {
    showYearSheet.value = true;
};

const onYearSelect = (action) => {
    selectedYear.value = action.value;
    showYearSheet.value = false;
    showSemesterSheet.value = true;
};

const onSemesterSelect = (action) => {
    selectedSemester.value = action.value;
    showSemesterSheet.value = false;
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

    selectedFilters.value = {
        year: selectedYear.value,
        semester: selectedSemester.value,
        faculty: selectedFaculty.value,
        course: selectedCourse.value,
        group: selectedGroup.value
    };

    resetSelection();
};

const goBack = (level) => {
    if (level === 'semester') {
        selectedSemester.value = null;
        selectedFaculty.value = null;
        selectedCourse.value = null;
        selectedGroup.value = null;
        showSemesterSheet.value = false;
        showYearSheet.value = true;
    } else if (level === 'faculty') {
        selectedFaculty.value = null;
        selectedCourse.value = null;
        selectedGroup.value = null;
        showFacultySheet.value = false;
        showSemesterSheet.value = true;
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
    selectedSemester.value = null;
    selectedFaculty.value = null;
    selectedCourse.value = null;
    selectedGroup.value = null;
};

const parseStartAppParam = async () => {
    let appParam = null;
  
    // First, try to get startapp parameter from URL (browser)
    const params = new URLSearchParams(window.location.search);
    appParam = params.get('startapp');
  
    // If not found in URL, try to get from Telegram Web App
    if (!appParam && window.Telegram?.WebApp) {
        try {
          const tg = window.Telegram.WebApp;
          tg.ready();
          appParam = tg.initDataUnsafe?.start_param;
        } catch (error) {
          console.error('Error getting Telegram start_param:', error);
        }
    }
  
    if (!appParam) return;

    const parts = appParam.split('_');
    if (parts.length !== 5) return;

    const [year, semester, faculty, course, group] = parts;

    // Validate year
    if (!availableYears.includes(parseInt(year))) return;

    // Find semester in filters (allFilters contains semesters)
    const semesterObj = allFilters.value.find(s => s.code === semester);
    if (!semesterObj) return;

    // Find faculty in semester
    const facultyObj = semesterObj.data.find(f => f.code === faculty);
    if (!facultyObj) return;

    // Find course in faculty
    const courseObj = facultyObj.data.find(c => c.code === course);
    if (!courseObj) return;

    // Find group in course
    const groupObj = courseObj.data.find(g => g.code === group);
    if (!groupObj) return;

    // All valid, set filters
    selectedFilters.value = {
        year: parseInt(year),
        semester,
        faculty,
        course,
        group
    };
};

onMounted(async () => {
    await loadFilters();
    await parseStartAppParam();
    
    // Fade out loader after everything is loaded
    await new Promise(resolve => setTimeout(resolve, 300));
    isLoading.value = false;
});
</script>

<style scoped>
.app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    background: #1989fa;
    color: white;
    padding: 0 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.navbar-left,
.navbar-right {
    flex: 1;
    display: flex;
    align-items: center;
}

.navbar-left {
    justify-content: flex-start;
}

.navbar-right {
    justify-content: flex-end;
    cursor: pointer;
}

.navbar-center {
    flex: 2;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
}

.navbar-text {
    font-size: 16px;
    cursor: pointer;
    padding: 8px 16px;
}

.navbar-text:active {
    opacity: 0.7;
}

.app-content {
    flex: 1;
    overflow-y: auto;
    padding-top: 0;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
    font-size: 16px;
    flex-direction: column;
    gap: 30px;
    text-align: center;
    padding: 15px;
}

.info-popup {
    --van-popup-background: white;
}

.info-popup-content {
    padding: 20px;
    border-radius: 12px 12px 0 0;
    max-height: 80vh;
    overflow-y: auto;
}

.info-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.info-popup-header h3 {
    margin: 0;
    font-size: 18px;
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

.text-hint {
    color: #999;
    font-size: 12px;
}

.info-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-section {
    margin-bottom: 20px;
}

.info-section:last-child {
    margin-bottom: 0;
}

.info-title {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 700;
    color: #1989fa;
}

.info-subtitle {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
}

.info-description {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.6;
}

.info-text {
    margin: 0;
    font-size: 13px;
    color: #666;
    line-height: 1.6;
}

.info-link {
    color: #1989fa;
    text-decoration: none;
    font-weight: 500;
}

.info-link:active {
    opacity: 0.7;
}

.info-list {
    margin: 8px 0 0 20px;
    padding: 0;
    font-size: 13px;
    color: #666;
    line-height: 1.8;
}

.info-list li {
    margin-bottom: 6px;
}

.info-note {
    margin: 12px 0 0 0;
    font-size: 12px;
    color: #999;
    font-style: italic;
    line-height: 1.6;
}

.global-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.98);
    z-index: 10000;
    animation: loaderFadeOut 0.3s ease-out 0.3s forwards;
}

.loader-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f0f0f0;
    border-top: 4px solid #1989fa;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

.loader-text {
    font-size: 14px;
    color: #666;
    margin: 0;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes loaderFadeOut {
    from {
        opacity: 1;
        visibility: visible;
    }
    to {
        opacity: 0;
        visibility: hidden;
    }
}

.global-loader[style*="display: none"] {
    animation: none;
}
</style>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#app {
    width: 100%;
    height: 100%;
}

.app {
    background: #f5f5f5;
    height: 100%;
}
</style>
