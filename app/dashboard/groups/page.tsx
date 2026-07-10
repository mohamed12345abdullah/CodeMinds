'use client'
import React, { useEffect, useState } from "react";
import "./groups.css";

// local url
// const baseUrl = "http://localhost:4000/api";

// production url
const baseUrl = "https://code-minds-website.vercel.app/api";

import NotificationPage from "../../notification/page";
import Navbar from "@/app/components/Navbar";
import { get } from "http";

enum notificationStatus { success = "success", error = "error", warning = "warning" };

interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
}

interface InstructorType {
  _id: string;
  name: string;
  email: string;
  profileRef: {
    specialization: string;
  }
}

interface StudentType {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileRef: {
    age: number;
  }
}

interface requestType {
  _id: string;
 course:CourseType;
 student:StudentType;
 status:string;
}

interface GroupType {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  totalSeats: number;
  instructor: InstructorType;
  course: CourseType;
  students: StudentType[];
}

interface FormDataType {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  totalSeats: number;
  instructorId: string;
  courseId: string;
}

const GroupForm = () => {
  const [formData, setFormData] = useState<FormDataType>({
    _id: "",
    title: "",
    startDate: "",
    endDate: "",
    totalSeats: 0,
    instructorId: "",
    courseId: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [instructors, setInstructors] = useState<InstructorType[]>([]);
  const [requests, setRequests] = useState<requestType[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [draggedRequest, setDraggedRequest] = useState<requestType | null>(null);

  const [notification, setNotification] = useState<{ message: string; status: notificationStatus; k: number } | null>(null);

  const showNotification = (message: string, status: notificationStatus) => {
    setNotification({ message, status, k: Date.now() });
  };
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const fetchGroups = async () => {
    try {
      const res = await fetch(`${baseUrl}/groups`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      });
      if(!res.ok){
        if(res.status === 401){
          showNotification("Unauthorized", notificationStatus.error);
          window.location.href = '/login';

        }else if(res.status === 403){
          showNotification("Forbidden", notificationStatus.error);
          window.location.href = '/login';

        }
        return;
      }
      const data = await res.json();
      if(data.success){
        showNotification("Groups fetched successfully", notificationStatus.success);
        if(data.data.length >0){
          console.log("groups:", data.data);
          setGroups(data.data);
        }else{
          showNotification("No groups found", notificationStatus.warning);
        }
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      showNotification("Error fetching groups", notificationStatus.error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${baseUrl}/courses`, {
        headers: {
          authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      });
      if(!res.ok){
        if(res.status === 401){
          showNotification("Unauthorized", notificationStatus.error);
          window.location.href = '/login';
        }else if(res.status === 403){
          showNotification("Forbidden", notificationStatus.error);
          window.location.href = '/login';
        }
        return;
      }
      const data = await res.json();
      setCourses(data.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await fetch(`${baseUrl}/instructors/accepted`, {
        method: "GET",
        headers: {

          authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      });
      if(!res.ok){
        if(res.status === 401){
          showNotification("Unauthorized", notificationStatus.error);
          window.location.href = '/login';
        }else if(res.status === 403){
          showNotification("Forbidden", notificationStatus.error);
          window.location.href = '/login';
        }
        return;
      }
      const data = await res.json();
      console.log("instructors:", data.data); 
      setInstructors(data.data);
      showNotification("Instructors fetched successfully", notificationStatus.success);
    } catch (error: any) {
      console.error("Error fetching instructors:", error.message);
      showNotification("Error fetching instructors", notificationStatus.error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${baseUrl}/requests/accepted`, {
        headers: {
          authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      });
      if(!res.ok){
        if(res.status === 401){
          showNotification("Unauthorized", notificationStatus.error);
          window.location.href = '/login';
        }else if(res.status === 403){
          showNotification("Forbidden", notificationStatus.error);
          window.location.href = '/login';
        }
        return;
      }
      const data = await res.json();
      console.log("requests:", data.data);
      if(data.success){
        showNotification("Students fetched successfully", notificationStatus.success);
        if(data.data.length >0){
          setRequests(data.data);

        }else{
          showNotification("No students found", notificationStatus.warning);
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      showNotification("Error fetching students", notificationStatus.error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchCourses();
    fetchInstructors();
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = formData._id
        ? `${baseUrl}/groups/${formData._id}`
        : `${baseUrl}/groups`;
      
      const method = formData._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: formData.title,
          startDate: formData.startDate,
          endDate: formData.endDate,
          totalSeats: formData.totalSeats,
          courseId: formData.courseId,
          instructorId: formData.instructorId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save group");

      await fetchGroups();
      closeModal();
      setFormData({
        _id: "",
        title: "",
        startDate: "",
        endDate: "",
        totalSeats: 0,
        instructorId: "",
        courseId: "",
      });
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    // confirm to delelte
    const confirmDelete = window.confirm("Are you sure you want to delete this group?");
    if (!confirmDelete) return;
    try {
      const response = await fetch(`${baseUrl}/groups/${id}`, {
        method: "DELETE",
        headers:{
          'authorization': `Bearer ${window.localStorage.getItem("token")}`,
        }
      });

      if (!response.ok) throw new Error("Failed to delete group");

      await fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  const handleUpdateGroup = (group: GroupType) => {
    setFormData({
      _id: group._id,
      title: group.title,
      startDate: group.startDate.split('T')[0],
      endDate: group.endDate.split('T')[0],
      totalSeats: group.totalSeats,
      instructorId: group.instructor._id,
      courseId: group.course._id,
    });
    openModal();
  };

  const handleDragStart = (request: requestType) => {
    setDraggedRequest(request);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (groupId: string) => {
    if (!draggedRequest) return;

    try {
      const response = await fetch(`${baseUrl}/groups/addStudent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          reqToEnrollId: draggedRequest._id,
          groupId, 
          studentId: draggedRequest.student._id 
        }),
      });

      if (!response.ok) throw new Error("Failed to add student to group");

      await fetchGroups();
      setDraggedRequest(null);
    } catch (error) {
      console.error("Error adding student to group:", error);
    }
  };

  const filteredGroups = groups.filter(group => 
    selectedCourseId ? group.course._id === selectedCourseId : true
  );
  
  console.log("requests is================== ",requests)
  console.log("selectedCourseId is================== ",selectedCourseId)
  const filteredStudents = requests.filter(request =>
    selectedCourseId ? request.course._id === selectedCourseId : true
  );

  return (
    <>
    <Navbar />
    <div className="group-manager-container">
      <button onClick={openModal} className="add-group-btn">Add Group</button>
      
      <div className="course-tabs">
        <button 
          className={`tab-btn ${!selectedCourseId ? 'active' : ''}`}
          onClick={() => setSelectedCourseId("")}
        >
          All Courses
        </button>
        {courses.map(course => (
          <button
            key={course._id}
            className={`tab-btn ${selectedCourseId === course._id ? 'active' : ''}`}
            onClick={() => setSelectedCourseId(course._id)}
          >
            {course.title}
          </button>
        ))}
      </div>

      {filteredGroups.length > 0 ? (
        <div className="groups-grid">
        { filteredGroups?.map((group) => (
          <div 
            key={group._id} 
            className="group-card"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(group._id)}
          >
            <h3>{group.title}</h3>
            <div className="group-details">
              <p><strong>Course:</strong> {group.course.title?group.course.title:"not found"}</p>
              <p><strong>Start Date:</strong> {new Date(group.startDate).toLocaleDateString()?new Date(group.startDate).toLocaleDateString():"not found"}</p>
              <p><strong>End Date:</strong> {new Date(group.endDate).toLocaleDateString()?new Date(group.endDate).toLocaleDateString():"not found"}</p>
              <p><strong>Total Seats:</strong> {group.totalSeats}</p>
              <p><strong>Instructor:</strong> {group.instructor.name?group.instructor.name:"not found"}</p>
              
              <div className="group-students">
                <h4>Students in Group ({group.students?.length || 0})</h4>
                <div className="students-in-group">
                  {group.students?.map(student => (
                    <div key={student._id} className="student-in-group">
                      <p>{student.name}</p>
                      <p className="student-email">{student.email}</p>
                    </div>
                  ))}
                  {(!group.students || group.students.length === 0) && (
                    <p className="no-students">No students in this group yet</p>
                  )}
                </div>
              </div>
            </div>
            <div className="group-actions">
              <button onClick={() => handleUpdateGroup(group)} className="update-btn">
                Update
              </button>
              <button onClick={() => handleDeleteGroup(group._id)} className="delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      ) : (
        <p>No groups found</p>
      )}
 
      <div className="students-container">
        <h3>Students</h3>
        <div className="students-list">
          {filteredStudents.map(student => (
            <div
              key={student._id} 
              className="student-card"
              draggable
              onDragStart={() => handleDragStart(student)}
            >
              <p><strong>Name:</strong> {student.student.name}</p>
              <p><strong>Email:</strong> {student.student.email}</p>
              <p><strong>Phone:</strong> {student.student.phone}</p>
              <p><strong>Age:</strong> {student.student.profileRef.age}</p>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="group-form">
            <div onClick={closeModal} className="close-button">X</div>
            
            <input
              type="text"
              name="title"
              placeholder="Group Title"
              value={formData.title}
              onChange={handleChange}
              required
              className="group-input"
            />

            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
              className="group-input"
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              name="instructorId"
              value={formData.instructorId}
              onChange={handleChange}
              required
              className="group-input"
            >
              <option value="">Select Instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor._id} value={instructor._id}>
                  {`${instructor.name} , ${instructor.profileRef.specialization}`}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="group-input"
            />

            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="group-input"
            />

            <input
              type="number"
              name="totalSeats"
              placeholder="Total Seats"
              value={formData.totalSeats}
              onChange={handleChange}
              required
              className="group-input"
            />

            <button type="submit" className="submit-btn">
              {formData._id ? "Update Group" : "Create Group"}
            </button>
          </form>
        </div>
      )}
    </div>
    {notification && (
      <NotificationPage key={notification.k} text={notification.message} status={notification.status} k={notification.k} />
    )}
    </>
  );
};

export default GroupForm;
