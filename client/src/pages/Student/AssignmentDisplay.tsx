import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { assignment } from '../../components/Interfaces';
import StudentSidebar from '../../components/StudentSidebar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';

// Quill.js
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';

// Custom styles
import "../../assets/styles/assignment.css";

// Hook (credit: https://usehooks.com/useLocalStorage/)
function useLocalStorage(key: string, initialValue: any) {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState(() => {
      try {
        // Get from local storage by key
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        // If error also return initialValue
        console.log(error);
        return initialValue;
      }
    });
  
    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: any) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error);
      }
    };
  
    return [storedValue, setValue];
}

const AssignmentDisplay = (props: any) => {
    // TODO: Get assignment
    let id = props.match.params.id;
    let [assignment, setAssignment] = useState<assignment>({
        title: "Assignment Title",
        date_assigned: "Fri Aug 07 2020 13:41:27 GMT+0100",
        assigned_to: "Your class",
        assigned_by: "Your teacher",
        due_by: "Fri Aug 09 2020 13:41:27 GMT+0100",
        content: "<p>The assignment is loading... hang in there!</p>",
        filenames: ["doctor.png"],
        estimated_time: "30",
        submissions: new Array<string>(),
        id: id,
    });
    let [status, setStatus] = useState<any>(<div />);
    let [ready, setReady] = useState<boolean>(false);

    useEffect(() => {
        setStatus(
            <Alert key="err" variant="info">
                We're loading your assignment... hang tight!
            </Alert>
        );

        fetch('/api/student/assignment/' + id)
            .then(res => res.json()).then(data => {
                setAssignment(data.data.assignment);
                setReady(true);
            })
            .catch(reason => {
                setStatus(
                    <Alert key="err" variant="danger">
                        Woah well that's strange... this assignment doesn't exist.
                        Try viewing <Link to="/student/assignments">assignments</Link> directly.
                    </Alert>
                );
                console.error(reason);
            })
    }, []);


    // Formatting time
    const deadline = new Date(assignment.due_by);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const date = deadline.toLocaleDateString(undefined, options);
    const timestamp = deadline.toLocaleTimeString();

    // TODO: actually link the assignment
    const assignmentLink = "/assignments/" + assignment.title;
    const estimation = assignment.estimated_time === undefined ? "no estimated time" : `around ${assignment.estimated_time} minutes`;
    
    let [cached, setCached] = useLocalStorage(assignment.id!, "Your assignment goes here");
    return (
        <React.Fragment>
            <StudentSidebar/>
            
            <div className="dash-content" id="assignment-display">
                <div className="dash-container">
                    {status}
                    <Row className={`h-100 ${ready ? 'd-inline' : 'd-none'}`}>
                        <Col className="col-12 col-md-5">
                            {/* Overview */}
                            <h3>{assignment.title}</h3>
                            <div className="assignment-meta-details">
                                <p>{assignment.assigned_by} &bull; <span className="subject-badge">{assignment.assigned_to}</span></p>
                                <p className="assignment-deadline">Due {date}, {timestamp} &bull; {estimation}</p>
                            </div>
                            <hr/>
                            <div>
                                {/* Replace w/ Quill.js */}
                                <ReactQuill theme="bubble" value={assignment.content} readOnly/>
                            </div>
                        </Col>
                        <Col className="col-12 col-md-7 d-flex flex-column">
                            {/* Submission Form */}
                            <h4>Submission</h4>
                            <form action="{assignmentLink}/submit" method="post" className="pt-1 d-flex flex-column flex-grow-1">
                                <div className="d-flex flex-column flex-grow-1 form-group">
                                    <ReactQuill theme="snow" value={cached} onChange={setCached}/>
                                    <input type="text" name="content" value={cached} hidden/>
                                    <small className="form-text text-muted">
                                        We automatically save your work to your 
                                        browser when you type - but don't worry,
                                        your teachers can't see until you send it.
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="files">File attachments</label>
                                    <input name="files" type="file" className="form-control-file" id="files"></input>
                                </div>
                                <button type="submit" className="btn btn-primary w-100">Submit</button>
                            </form>
                        </Col>
                    </Row>
                    <p className="text-right">
                        <small>
                            <code>Assignment ID: {assignment.id}</code>
                        </small>
                    </p>
                </div>
            </div>
        </React.Fragment>
    )
}

export default AssignmentDisplay;