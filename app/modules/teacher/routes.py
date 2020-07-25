import uuid
from datetime import datetime

from flask import flash, redirect, render_template, request, url_for
from flask_login import current_user
from werkzeug.utils import secure_filename

from app.decorators import required_access
from app.google_storage import upload_blob
from app.logger import logger
from app.modules._classes import Assignment, Classes

from . import teacher
from ._teacher import Teacher
from .forms import EditAssignmentForm, EditClassForm, NewAssignmentForm


@teacher.before_request
@required_access("Teacher")
def teacher_verification():
    # Required_access decorator already handled it
    pass


@teacher.route("/")
@teacher.route("/index")
@teacher.route("/dashboard")
def index():
    return render_template("teacher/dashboard.html")


@teacher.route("/profile")
def profile():
    return render_template("teacher/profile.html")


@teacher.route("/add_assignment", methods=["GET", "POST"])
def add_assignment():
    form = NewAssignmentForm()
    form.assigned_to.choices = current_user.get_class_names()

    if form.validate_on_submit():
        file_list = []
        files = request.files.getlist(form.files.name)
        if files[0].filename:
            for file_ in files:
                filename = file_.filename
                blob = upload_blob(
                    uuid.uuid4().hex + "." + file_.content_type.split("/")[-1], file_
                )
                file_list.append((blob.name, filename))

        new_assignment = Assignment(
            date_assigned=datetime.utcnow(),
            assigned_by=current_user.ID,
            assigned_to=form.assigned_to.data,
            due_by=form.due_by.data,
            title=form.title.data,
            content=form.content.data,
            filenames=file_list,
            estimated_time=form.estimated_time.data,
        )
        logger.info(f"Assignment {form.title.data} added")
        Classes.get_by_id(form.assigned_to.data).add_assignment(new_assignment)
        flash("Assignment sent!")
        return redirect(url_for("main.dashboard"))

    return render_template("teacher/add_assignment.html", form=form)

@teacher.route("/assignments", methods=["GET"])
def view_assignments():
    # Collect assignments from all classes
    classes = []
    for class_id in current_user.classes:
        class_ = Classes.get_by_id(class_id)
        class_assignments = class_.get_assignments()
        class_data = {
            'id': str(class_id),
            'name': class_.name,
            'assignments': list(map(lambda a: a.to_json(), class_assignments))
        }

        classes.append(class_data)
    
    return {
        'forms': {},
        'flashes': [],
        'data': {
            'classes': classes
        }
    }

@teacher.route("/assignments/<string:class_id>", methods=["GET"])
def view_assignment_by_class_id(class_id: str):
    # Collect assignments from all classes
    class_ = Classes.get_by_id(class_id)
    class_assignments = class_.get_assignments()
    
    return {
        'forms': {},
        'flashes': [],
        'data': {
            'assignments': list(map(lambda a: a.to_json(), class_assignments))
        }
    }


@teacher.route("/assignments/<string:class_id>/<string:assignment_id>", methods=["GET", "POST"])
def edit_assignment(class_id: str, assignment_id: str):
    # Find assignment in teacher's classes
    flashes = []
    class_ = Classes.get_by_id(class_id)
    assignments = class_.get_assignments()
    # TODO: Create custom error when assignment isn't found
    assignment: Assignment = list(filter(lambda a: str(a.ID) == assignment_id, assignments))[0]

    edit_assignment_form = EditAssignmentForm()
    if edit_assignment_form.validate_on_submit():
        # TODO: Edit assignment data
        edited_assignment = Assignment(
            date_assigned=assignment.date_assigned,
            assigned_by=assignment.assigned_by,
            assigned_to=form.assigned_to.data,
            due_by=form.due_by.data,
            title=form.title.data,
            content=form.content.data,
            filenames=file_list,
            estimated_time=form.estimated_time.data,
        )
        edited_assignment.ID = assignment.ID
        class_.edit_assignment(edited_assignment)
        # Assign to 'assignment' so form has new details
        assignment = edited_assignment
    
    # Set default values for form.
    edit_assignment_form.assigned_to.default = assignment.assigned_to
    edit_assignment_form.due_by.default = assignment.due_by
    edit_assignment_form.estimated_time.default = assignment.estimated_time
    edit_assignment_form.title.default = assignment.title
    edit_assignment_form.content.default = assignment.content
    # TODO: Handle default files
    # edit_assignment_form.files.default = assignment.filenames

    return {
        'forms': {
            'edit_assignment': edit_assignment_form.get_form_json()
        },
        'flashes': flashes,
        'data': {
            'assignment': assignment.to_json()
        }
    }


@teacher.route("/class", methods=["GET"])
def manage_classes():
    print(current_user.get_class_names()[0][0])
    return redirect(
        url_for(
            "teacher.manage_classes_by_id",
            class_id=current_user.get_class_names()[0][0],
        )
    )


@teacher.route("/class/<string:class_id>", methods=["GET", "POST"])
def manage_classes_by_id(class_id: str):
    class_edit_form = EditClassForm()
    class_ = Classes.get_by_id(class_id)

    syllabus_name = class_.get_syllabus_name()
    if syllabus_name is not None:
        if len(syllabus_name) > 20:
            syllabus_name = syllabus_name[:20] + "..."
        class_edit_form.syllabus.label.text = (
            f"Update syllabus (current: { syllabus_name })"
        )

    if class_edit_form.validate_on_submit():
        syllabus = tuple()
        if class_edit_form.syllabus.name is not None:
            syllabus_file = request.files[class_edit_form.syllabus.name]
            filename = syllabus_file.filename
            blob = upload_blob(
                uuid.uuid4().hex + "." + syllabus_file.content_type.split("/")[-1],
                syllabus_file,
            )
            syllabus = (blob.name, filename)
        logger.info(f"Syllabus updated")
        class_.update_description(class_edit_form.description.data)
        class_.update_syllabus(syllabus)

        flash("Class information successfully updated!")

    return render_template(
        "/teacher/manage_classes.html",
        classes=current_user.get_class_names(),
        class_json=class_.to_json(),
        class_edit_form=class_edit_form,
        current_description=class_.description,
    )
