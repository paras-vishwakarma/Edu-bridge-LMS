import { mockCourses, mockEnrollments } from '../data/mockData';

// ── Storage Keys ──────────────────────────────────────────────────────────────
const COURSES_KEY     = 'lerno_courses';
const ENROLLMENTS_KEY = 'lerno_enrollments';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Load courses from localStorage.
 * ALWAYS returns stored data if it exists — never overwrites persisted data.
 */
function loadCourses() {
  try {
    const stored = localStorage.getItem(COURSES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore corrupt data */ }

  // First-ever run: seed from mockData
  console.info('[CourseService] Seeding courses from mockData for the first time.');
  const seeded = [...mockCourses];
  localStorage.setItem(COURSES_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveCourses(courses) {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

/**
 * Load enrollments from localStorage.
 * ALWAYS returns stored data if it exists — never overwrites persisted data.
 */
function loadEnrollments() {
  try {
    const stored = localStorage.getItem(ENROLLMENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore corrupt data */ }

  // First-ever run: seed from mockData
  console.info('[CourseService] Seeding enrollments from mockData for the first time.');
  const seeded = [...mockEnrollments];
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveEnrollments(enrollments) {
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
}

// ── Initialization ─────────────────────────────────────────────────────────────
/**
 * Called once on app startup to ensure all tables are seeded.
 * Safe to call multiple times — does nothing if data already exists.
 */
export function initializeDatabase() {
  loadCourses();     // seeds if absent
  loadEnrollments(); // seeds if absent
  console.info('[DB] Database initialized.');
}

// ── Service ───────────────────────────────────────────────────────────────────
export const courseService = {
  async getAllCourses() {
    return loadCourses();
  },

  async getPublishedCourses() {
    const courses = loadCourses();
    return courses.filter(c => c.status === 'published');
  },

  async getCourseById(id) {
    const courses = loadCourses();
    return courses.find(c => c.id === id) || null;
  },

  async getCoursesByInstructor(instructorId) {
    const courses = loadCourses();
    return courses.filter(c => c.instructorId === instructorId);
  },

  async createCourse(courseData) {
    const courses = loadCourses();
    const newCourse = {
      id: `course-${Date.now()}`,
      ...courseData,
      rating: 0,
      reviewCount: 0,
      enrollmentCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      sections: courseData.sections || [],
      tags: courseData.tags || [],
    };
    courses.push(newCourse);
    saveCourses(courses); // ✅ Persisted immediately
    return newCourse;
  },

  async updateCourse(courseId, updates) {
    const courses = loadCourses();
    const idx = courses.findIndex(c => c.id === courseId);
    if (idx === -1) return { success: false, error: 'Course not found.' };
    courses[idx] = {
      ...courses[idx],
      ...updates,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    saveCourses(courses); // ✅ Persisted immediately
    return { success: true, course: courses[idx] };
  },

  async deleteCourse(courseId) {
    const courses = loadCourses();
    const filtered = courses.filter(c => c.id !== courseId);
    if (filtered.length === courses.length) return { success: false, error: 'Course not found.' };
    saveCourses(filtered);
    // Also remove enrollments for this course
    const enrollments = loadEnrollments();
    saveEnrollments(enrollments.filter(e => e.courseId !== courseId));
    return { success: true };
  },

  // ── Enrollment ──────────────────────────────────────────────────────────────
  async enrollStudent(studentId, courseId) {
    const enrollments = loadEnrollments();
    const alreadyEnrolled = enrollments.some(
      e => e.studentId === studentId && e.courseId === courseId
    );
    if (alreadyEnrolled) return { success: false, error: 'Already enrolled.' };

    const newEnrollment = {
      id: `enr-${Date.now()}`,
      studentId,
      courseId,
      enrolledAt: new Date().toISOString().slice(0, 10),
      progress: 0,
      completedLessons: [],
    };
    enrollments.push(newEnrollment);
    saveEnrollments(enrollments); // ✅ Persisted immediately

    // Increment course enrollment count
    const courses = loadCourses();
    const courseIdx = courses.findIndex(c => c.id === courseId);
    if (courseIdx !== -1) {
      courses[courseIdx].enrollmentCount = (courses[courseIdx].enrollmentCount || 0) + 1;
      saveCourses(courses);
    }

    return { success: true, enrollment: newEnrollment };
  },

  async unenrollStudent(studentId, courseId) {
    const enrollments = loadEnrollments();
    const filtered = enrollments.filter(
      e => !(e.studentId === studentId && e.courseId === courseId)
    );
    if (filtered.length === enrollments.length) {
      return { success: false, error: 'Enrollment not found.' };
    }
    saveEnrollments(filtered);

    // Decrement enrollment count
    const courses = loadCourses();
    const courseIdx = courses.findIndex(c => c.id === courseId);
    if (courseIdx !== -1) {
      courses[courseIdx].enrollmentCount = Math.max(
        0,
        (courses[courseIdx].enrollmentCount || 1) - 1
      );
      saveCourses(courses);
    }
    return { success: true };
  },

  async getStudentEnrollments(studentId) {
    const enrollments = loadEnrollments();
    return enrollments.filter(e => e.studentId === studentId);
  },

  async getCourseEnrollments(courseId) {
    const enrollments = loadEnrollments();
    return enrollments.filter(e => e.courseId === courseId);
  },

  async isEnrolled(studentId, courseId) {
    const enrollments = loadEnrollments();
    return enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
  },

  async completeLesson(studentId, courseId, lessonId) {
    const enrollments = loadEnrollments();
    const idx = enrollments.findIndex(
      e => e.studentId === studentId && e.courseId === courseId
    );
    if (idx === -1) return { success: false, error: 'Enrollment not found.' };

    const enrollment = enrollments[idx];
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Recalculate progress based on total lessons in this course
    const courses = loadCourses();
    const course = courses.find(c => c.id === courseId);
    if (course && course.sections) {
      const totalLessons = course.sections.reduce(
        (sum, s) => sum + (s.lessons ? s.lessons.length : 0), 0
      );
      enrollment.progress = totalLessons > 0
        ? Math.round((enrollment.completedLessons.length / totalLessons) * 100)
        : 0;
    }

    enrollments[idx] = enrollment;
    saveEnrollments(enrollments); // ✅ Persisted immediately
    return { success: true, enrollment };
  },

  async getEnrollmentStats() {
    return loadEnrollments();
  },

  /** Utility: get full stats for the admin dashboard */
  async getDashboardStats() {
    const courses     = loadCourses();
    const enrollments = loadEnrollments();
    return {
      totalCourses:      courses.length,
      publishedCourses:  courses.filter(c => c.status === 'published').length,
      draftCourses:      courses.filter(c => c.status === 'draft').length,
      totalEnrollments:  enrollments.length,
      totalStudents:     [...new Set(enrollments.map(e => e.studentId))].length,
    };
  },
};
