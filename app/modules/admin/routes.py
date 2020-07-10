from datetime import datetime
from flask import redirect, url_for, flash, render_template, request
from flask_login import current_user
from werkzeug.utils import secure_filename

from . import admin

from ._admin import Admin
from app.modules._classes import Classes

from app.logs.user_logger import user_logger
from app import db
from .forms import NewStudentsTeachers, NewClasses, AddStudentClass, AddTeacherClass 
from app.decorators import required_access
from app.google_storage import upload_blob
from app.modules._classes import Assignment, Classes
from app.logs.form_logger import form_logger
import uuid
from app.modules.teacher._teacher import Teacher
from app.modules.student._student import Student
from bson import ObjectId

from app.decorators import required_access

@admin.before_request
@required_access('Admin')
def admin_verification():
    # Required_access decorator already handled it
    pass


@admin.route('/')
@admin.route('/index')
@admin.route('/dashboard')
def index():
    return render_template('admin/dashboard.html')


@admin.route('/profile')
def profile():
    # add_student("912f58eccfe825c85801", "coolgm@gmail.com")
    return render_template('admin/profile.html')



@admin.route('/registerTS', methods=['GET', 'POST'])
def registerTS():
    form = NewStudentsTeachers()
    if form.validate_on_submit():
        user = eval(
            f'{form.user_type.data}(email=form.email.data.lower(), first_name=form.first_name.data, last_name=form.last_name.data)')

        user.set_password(form.password.data)
        user.set_secret_question(question=form.secret_question.data, answer=form.secret_answer.data.lower())
        if user.add():
            db.delete_auth_token(form.auth_token.data)
            user_logger.info("NEW USER: {} {} {} - ACCESS: {}".format(user.first_name, user.last_name, user.email, user.USERTYPE))
            return redirect(url_for('auth.login'))
        else:
            user_logger.error("Unknown error while registering: {} {} {} - ACCESS: {}".format(user.first_name, user.last_name, user.email, user.USERTYPE))
            flash('Unknown error while registering.')

    return render_template('admin/register.html', form=form)


@admin.route('/registerClasses', methods=['GET', 'POST'])
def registerClasses():
    form = NewClasses()

    if form.validate_on_submit():
        new_class = Classes(department=form.department.data,
                                    number=form.number.data,
                                    name=form.name.data,
                                    teacher=ObjectId(form.teacher.data),
                                    description=form.description.data,
                                    schedule_time=form.schedule_time.data,
                                    schedule_days=form.schedule_days.data,
                                    syllabus=form.syllabus.data,
                                    )
        
        Admin.add_class(new_class)

        flash('Added Class!')
        return redirect(url_for('main.dashboard'))

    return render_template('admin/register.html', form=form)



@admin.route('/studentClass', methods=['GET', 'POST'])
def addStudentClass():
    form = AddStudentClass()
    if form.validate_on_submit():
        Admin.add_student(form.class_id.data, form.email.data)
    return render_template('admin/register.html', form=form)

@admin.route('/teacherClass', methods=['GET', 'POST'])
def addTeacherClass():
    form = AddTeacherClass()
    if form.validate_on_submit():
        Admin.add_teacher(form.class_id.data, form.email.data)
    return render_template('admin/register.html', form=form)


# @admin.route('/class', methods=['GET'])
# def manage_classes():
#     return redirect(url_for('admin.manage_classes_by_id', class_id=current_user.get_class_names()[0][0]))

# @admin.route('/class/<string:class_id>', methods=['GET'])
# def manage_classes_by_id(class_id: str):
#     return render_template('/admin/manage_classes.html', classes=current_user.get_class_names(), class_json=Classes.get_by_id(class_id).to_json())