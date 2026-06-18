// LocalStorage-based API client (no backend required)
import { 
  getAllUsers, 
  saveUserProfile, 
  getUserProfile,
  getAllEvents,
  saveEvent,
  updateEvent,
  deleteEvent as deleteEventFromStorage,
  saveAttendance,
  getUserAttendance,
  getAllAttendance,
  saveRSVP,
  deleteRSVP,
  getUserRSVPs,
  isUserRSVPed,
  savePayment,
  getPayments,
  generateId
} from './storage';

export class ApiClient {
  private accessToken: string | null = null;
  private currentUserId: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
  }

  // Events
  async getEvents() {
    const events = getAllEvents();
    return { events };
  }

  async createEvent(event: any) {
    const newEvent = {
      id: generateId(),
      ...event,
      createdAt: new Date().toISOString(),
    };
    saveEvent(newEvent);
    return { event: newEvent };
  }

  async updateEvent(eventId: string, updates: any) {
    updateEvent(eventId, updates);
    return { success: true };
  }

  async deleteEvent(eventId: string) {
    deleteEventFromStorage(eventId);
    return { success: true };
  }

  // Attendance
  async checkIn(sessionCode?: string, eventId?: string) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const attendance = {
      id: generateId(),
      userId: this.currentUserId,
      eventId,
      sessionCode,
      checkedInAt: new Date().toISOString(),
    };

    saveAttendance(attendance);
    return { success: true, attendance };
  }

  async getAttendance(userId: string) {
    const attendance = getUserAttendance(userId);
    return { attendance };
  }

  async recordClassAttendance(sessionCode: string, className: string) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const attendance = {
      id: generateId(),
      userId: this.currentUserId,
      sessionCode,
      className,
      checkedInAt: new Date().toISOString(),
    };

    saveAttendance(attendance);
    return { success: true, attendance };
  }

  // RSVP
  async rsvpEvent(eventId: string) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const rsvp = {
      id: generateId(),
      userId: this.currentUserId,
      eventId,
      rsvpedAt: new Date().toISOString(),
    };

    saveRSVP(rsvp);
    return { success: true, rsvp };
  }

  async cancelRsvp(eventId: string) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    deleteRSVP(this.currentUserId, eventId);
    return { success: true };
  }

  async getUserRsvps(userId: string) {
    const rsvps = getUserRSVPs(userId);
    return { rsvps };
  }

  // Admin
  async getAdminStats() {
    const users = getAllUsers();
    const events = getAllEvents();
    const attendance = getAllAttendance();

    const stats = {
      totalUsers: users.length,
      totalStudents: users.filter(u => u.role === 'student').length,
      totalEvents: events.length,
      totalAttendance: attendance.length,
    };

    return { stats };
  }

  async getAllUsers() {
    const users = getAllUsers();
    return { users };
  }

  async updateUserRole(userId: string, role: string) {
    const profile = getUserProfile(userId);
    if (profile) {
      saveUserProfile(userId, { ...profile, role: role as any });
    }
    return { success: true };
  }

  async verifyUser(userId: string, approved: boolean) {
    const profile = getUserProfile(userId);
    if (profile) {
      saveUserProfile(userId, {
        ...profile,
        verified: approved,
        verificationStatus: approved ? 'approved' : 'rejected',
      });
    }
    return { success: true };
  }

  async getPendingVerifications() {
    const users = getAllUsers().filter(
      u => (u.role === 'committee' || u.role === 'tutor') && !u.verified
    );
    return { users };
  }

  // Chatbot
  async askChatbot(question: string) {
    // Simple FAQ responses
    const lowerQuestion = question.toLowerCase();
    
    let response = "I'm here to help! Please ask me about:\n- Membership fees and registration\n- Class schedules and locations\n- Events and activities\n- Payment methods\n- Level assessments";

    if (lowerQuestion.includes('fee') || lowerQuestion.includes('price') || lowerQuestion.includes('cost')) {
      response = "Membership fee is RM50 per semester for students. Committee members and tutors get free access after admin verification.";
    } else if (lowerQuestion.includes('level') || lowerQuestion.includes('assessment')) {
      response = "There are 5 proficiency levels. You start at Level 1 and can advance through assessments. Complete assessments to progress to the next level!";
    } else if (lowerQuestion.includes('event') || lowerQuestion.includes('activity')) {
      response = "Check the Events Calendar for upcoming activities! You can RSVP to events and receive notifications about venue changes and reminders.";
    } else if (lowerQuestion.includes('checkin') || lowerQuestion.includes('check in') || lowerQuestion.includes('attendance')) {
      response = "You can check in to events and classes using QR codes or session codes. Just scan the QR code or enter the session code provided by your tutor or at the event.";
    } else if (lowerQuestion.includes('payment') || lowerQuestion.includes('pay')) {
      response = "Payments can be made through bank transfer or credit card. Once paid, your membership will be activated immediately.";
    } else if (lowerQuestion.includes('tutor') || lowerQuestion.includes('teacher')) {
      response = "Our tutors are verified by admins. If you're a tutor, sign up and wait for admin approval to access the tutor dashboard where you can manage classes and grade students.";
    } else if (lowerQuestion.includes('committee')) {
      response = "Committee members can create events, generate QR codes for events, and help manage club activities. Sign up requires admin verification.";
    }

    return { response };
  }

  // Profile
  async getProfile(userId: string) {
    const profile = getUserProfile(userId);
    return { profile };
  }

  async createUser(userData: any) {
    const userId = generateId();
    const profile = {
      id: userId,
      ...userData,
      createdAt: new Date().toISOString(),
    };
    saveUserProfile(userId, profile);
    return { user: profile };
  }

  // Payment
  async processPayment(paymentData: any) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    // Get current profile to determine next level
    const currentProfile = getUserProfile(this.currentUserId);
    if (!currentProfile) {
      throw new Error('User profile not found. Please log out and log back in.');
    }

    const currentLevel = currentProfile.membershipLevel || currentProfile.level || 1;
    const nextLevel = Math.min(currentLevel + 1, 5); // Max level is 5

    const payment = {
      id: generateId(),
      userId: this.currentUserId,
      amount: paymentData.amount,
      level: nextLevel,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber,
      name: paymentData.name,
      email: paymentData.email,
      phoneNumber: paymentData.phoneNumber,
      status: 'completed',
      paidAt: new Date().toISOString(),
    };

    savePayment(this.currentUserId, payment);

    // Update user membership
    const profile = getUserProfile(this.currentUserId);
    if (profile) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 4); // 4 months validity (1 semester)
      
      saveUserProfile(this.currentUserId, {
        ...profile,
        membershipLevel: nextLevel,
        level: nextLevel,
        membershipExpiry: expiryDate.toISOString(),
      });

      // Also update individual localStorage keys
      localStorage.setItem(`user_membership_level_${this.currentUserId}`, String(nextLevel));
      localStorage.setItem(`user_membership_expiry_${this.currentUserId}`, expiryDate.toISOString());
    }

    return { success: true, payment };
  }

  async getPayments(userId: string) {
    const payments = getPayments(userId);
    return { payments };
  }

  // Assessments (stored in localStorage)
  async getAssessments() {
    const data = localStorage.getItem('assessments');
    const assessments = data ? JSON.parse(data) : [];
    return { assessments };
  }

  async createAssessment(assessment: any) {
    const assessments = (await this.getAssessments()).assessments;
    const newAssessment = {
      id: generateId(),
      ...assessment,
      createdAt: new Date().toISOString(),
    };
    assessments.push(newAssessment);
    localStorage.setItem('assessments', JSON.stringify(assessments));
    return { assessment: newAssessment };
  }

  async submitAssessment(assessmentId: string, answers: any[], score: number) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const submissions = this.getSubmissionsSync(this.currentUserId);
    const submission = {
      id: generateId(),
      userId: this.currentUserId,
      assessmentId,
      answers,
      score,
      submittedAt: new Date().toISOString(),
    };
    
    submissions.push(submission);
    localStorage.setItem(`submissions_${this.currentUserId}`, JSON.stringify(submissions));

    return { success: true, submission };
  }

  private getSubmissionsSync(userId: string) {
    const data = localStorage.getItem(`submissions_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  async getSubmissions(userId: string) {
    const submissions = this.getSubmissionsSync(userId);
    return { submissions };
  }

  async getCertificates(userId: string) {
    const data = localStorage.getItem(`certificates_${userId}`);
    const certificates = data ? JSON.parse(data) : [];
    return { certificates };
  }

  // Grading (Tutor)
  async submitGrade(gradeData: { studentId: string; assessmentType: string; grade: number; level: number }) {
    const grades = this.getGradesSync(gradeData.studentId);
    const grade = {
      id: generateId(),
      ...gradeData,
      gradedAt: new Date().toISOString(),
      gradedBy: this.currentUserId,
    };
    
    grades.push(grade);
    localStorage.setItem(`grades_${gradeData.studentId}`, JSON.stringify(grades));

    // Update student level if grade is passing
    if (gradeData.grade >= 50) {
      const profile = getUserProfile(gradeData.studentId);
      if (profile && profile.membershipLevel < gradeData.level + 1) {
        saveUserProfile(gradeData.studentId, {
          ...profile,
          membershipLevel: gradeData.level + 1,
        });
        localStorage.setItem(`user_membership_level_${gradeData.studentId}`, String(gradeData.level + 1));
      }
    }

    return { success: true, grade };
  }

  private getGradesSync(studentId: string) {
    const data = localStorage.getItem(`grades_${studentId}`);
    return data ? JSON.parse(data) : [];
  }

  async getGrades(studentId: string) {
    const grades = this.getGradesSync(studentId);
    return { grades };
  }

  // Class assignment (Admin)
  async assignClassToTutor(tutorId: string, className: string, level: number) {
    const profile = getUserProfile(tutorId);
    if (profile) {
      saveUserProfile(tutorId, {
        ...profile,
        assignedClass: className,
        assignedLevel: level,
      });
      
      // Also save to separate key for backward compatibility
      localStorage.setItem(`tutor_class_${tutorId}`, className);
      localStorage.setItem(`tutor_level_${tutorId}`, String(level));
    }
    return { success: true };
  }

  async getAllClasses() {
    const users = getAllUsers();
    const tutors = users.filter(u => u.role === 'tutor' && (u as any).assignedClass);
    const classes = tutors.map(t => ({
      tutorId: t.id,
      tutorName: t.name,
      className: (t as any).assignedClass,
      level: (t as any).assignedLevel || 1,
    }));
    return { classes };
  }

  async getTutorClass() {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const profile = getUserProfile(this.currentUserId);
    if (!profile) {
      return { class: null, students: [], attendance: [] };
    }

    const assignedClass = (profile as any).assignedClass;
    const assignedLevel = (profile as any).assignedLevel || 1;

    if (!assignedClass) {
      return { class: null, students: [], attendance: [] };
    }

    // Get all users and filter students
    const allUsers = getAllUsers();
    const students = allUsers.filter(u => u.role === 'student');

    // Get all attendance records for this class
    const allAttendance = getAllAttendance();
    const classAttendance = allAttendance.filter(a => 
      a.className === assignedClass || a.sessionCode === assignedClass
    );

    return {
      class: {
        className: assignedClass,
        level: assignedLevel,
      },
      students: students,
      attendance: classAttendance,
    };
  }
}

export const api = new ApiClient();