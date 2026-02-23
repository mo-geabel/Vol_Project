const apiUrl = "http://localhost:5000/api";
let token = "";

async function runTests() {
  console.log("Starting API Tests...");

  try {
    // 1. Auth Register
    console.log("1. Testing Register Admin...");
    let res = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Test Admin", username: `admin_${Date.now()}`, password: "password123", role: "admin" })
    });
    let data = await res.json();
    console.log(res.status, data.username ? 'Success' : data);
    token = data.token;

    // 2. Auth Login (we'll just use the token from register, but let's test)
    console.log("\n2. Testing Login...");
    res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: data.username, password: "password123" })
    });
    data = await res.json();
    console.log(res.status, data.token ? 'Success' : data);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Create Class
    console.log("\n3. Testing Create Class...");
    res = await fetch(`${apiUrl}/classes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ class_name: "Test Quran Class", type: "Quran", teacher_id: data.id })
    });
    let classData = await res.json();
    console.log(res.status, classData.id ? 'Success' : classData);

    // 4. Create Student
    console.log("\n4. Testing Create Student...");
    res = await fetch(`${apiUrl}/students`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: "Test Student", contact_info: "123", parent_info: "Parent", date_of_birth: "2010-01-01" })
    });
    let studentData = await res.json();
    console.log(res.status, studentData.id ? 'Success' : studentData);

    // 5. Enroll Student
    console.log("\n5. Testing Enroll Student...");
    res = await fetch(`${apiUrl}/enrollments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ student_id: studentData.id, class_id: classData.id })
    });
    let enrollmentData = await res.json();
    console.log(res.status, enrollmentData.id ? 'Success' : enrollmentData);

    // 6. Schedules
    console.log("\n6. Testing Schedule Setup...");
    res = await fetch(`${apiUrl}/schedules`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ month_year: "2026-02", weekend_config: [5, 6] })
    });
    let scheduleData = await res.json();
    console.log(res.status, scheduleData.schedule ? 'Success' : scheduleData);

    // 7. Progress
    console.log("\n7. Testing Progress...");
    res = await fetch(`${apiUrl}/progress/quran`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enrollment_id: enrollmentData.id, date: "2026-02-15", type: "Hifz", surah_id: 1, start_verse: 1, end_verse: 5 })
    });
    let progressData = await res.json();
    console.log(res.status, progressData.id ? 'Success' : progressData);

    // 8. Attendance
    console.log("\n8. Testing General Attendance Batch...");
    res = await fetch(`${apiUrl}/attendance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: "2026-02-16", attendanceList: [{ enrollment_id: enrollmentData.id, status: "Present" }] })
    });
    let attData = await res.json();
    console.log(res.status, attData.message ? 'Success' : attData);

    console.log("\nAll core tests completed.");
  } catch(e) {
    console.error("Test execution failed:", e);
  }
}
runTests();
