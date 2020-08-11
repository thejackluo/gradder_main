// NPM Imports
import React, { useState, useEffect, FunctionComponent } from "react";
import {
  Switch,
  BrowserRouter as Router,
  Route,
  Redirect,
} from "react-router-dom";

// Components
import Login from './pages/Login';
import StudentDash from './pages/Student/Dash';
import StudentAssignments from './pages/Student/Assignments';
import AssignmentDisplay from './pages/Student/AssignmentDisplay';
import StudentTimetable from './pages/Student/Timetable';
import StudentProfile from './pages/Student/Profile';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute'

// Types and interfaces
import { student } from "./components/Interfaces";

// Stylesheets
import "bootstrap/dist/css/bootstrap.min.css";


const App: FunctionComponent = () => {

  const [user, setUser] = useState<student>({
    userName: '',
    userType: '',
    loggedIn: false,
    dob: '',
  });

  // TODO: set logged in status to true
  useEffect(() => {
    fetch('/api/auth/login')
      .then(res => res.json()).then(response => {
        setUser(response['user_info']);
      }
    )
    console.log(user);
  }, []);

  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Login} />
        <Route exact path="/auth/logout" component={Login} />
        <Route exact path="/dashboard">
          {user.loggedIn ? (
            <Redirect to={"/" + user.userType + "/dashboard"} />
          ) : (
            <Login />
          )}
        </Route>
        <ProtectedRoute user={user} scope="student" exact path="/student/dashboard" render={(props: any) => (
          <StudentDash {...props} userName={user.userName} userType={user.userType} loggedIn={user.loggedIn} dob={user.dob}/> 
        )}/>
        <ProtectedRoute user={user} scope="student" exact path="/student/timetable" render={(props: any) => (
          <StudentTimetable {...props} userName={user.userName} userType={user.userType} loggedIn={user.loggedIn} dob={user.dob}/> 
        )}/>
        <ProtectedRoute user={user} scope="student" exact path="/student/assignments" render={(props: any) => (
          <StudentAssignments {...props} userName={user.userName} userType={user.userType} loggedIn={user.loggedIn} dob={user.dob}/> 
        )}/>
        <ProtectedRoute user={user} scope="student" exact path="/student/profile" render={(props: any) => (
          <StudentProfile {...props} userName={user.userName} userType={user.userType} loggedIn={user.loggedIn} dob={user.dob} />
        )}/>
        <Route
          exact
          path="/student/assignment/:id"
          render={(props) => (
            <AssignmentDisplay
              {...props}
            />
          )}
        />
        <Route exact path="/unauthorized" render={(props: any) => (
          <Unauthorized {...props}/>
        )}/>
      </Switch>
    </Router>
  );
};

export default App;
