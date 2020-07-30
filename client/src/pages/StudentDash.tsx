import React, { FunctionComponent } from 'react';
import { Link } from "react-router-dom";
import { student } from "../components/Interfaces";
import StudentSidebar from '../components/StudentSidebar';
import "../assets/styles/dashboard.css"

const StudentDash:FunctionComponent<student> = ({ userName }) => {

  // Get current time in hours:minutes
  const [hour, minute] = new Date().toLocaleTimeString().slice(0,7).split(":")
  const curTime = hour + ":" + minute

  // Get day, month, date
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const curDate = new Date().toLocaleDateString(undefined, options)

  return (
    <React.Fragment>

      <StudentSidebar/>

      <div className="dash-content" id="student-overview">

        <div className="student-dash-flex-row">
          <div className="dash-container statistics">
            <h5>Statistics</h5>
          </div>
          <div className="dash-container profile">
            <div className="profile-details">
              <h2>Hello, { userName }</h2>
              <img src="https://www.iambetter.org/wp-content/uploads/2020/04/Albert_Einstein_1024x1024.jpg" alt="Profile" className="profile-pic" />
            </div>
            <div className="profile-time">
              <Link to="/">
                <i className="material-icons-outlined">exit_to_app</i>
              </Link>
              <Link to="/dashboard">
                <i className="material-icons-outlined">mail</i>
              </Link>
              <h1>{curTime}</h1>
              <p>{curDate}</p>
            </div>
          </div>
        </div>

        <div className="student-dash-flex-row">
          <div className="dash-container timetable">
            <h5>Timetable</h5>
          </div>
          <div className="student-dash-flex-col">
            <div className="dash-container homework">
              <h5>Homework</h5>
            </div>
            <div className="dash-container grades">
              <h5>Grades</h5>
            </div>
          </div>
        </div>

      </div>

    </React.Fragment>
  );
};

export default StudentDash;