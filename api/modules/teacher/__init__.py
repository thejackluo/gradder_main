r"""The blueprint that handles all the teacher-related things.
This includes managing classes, posting assignments, viewing students, and more.
"""
from flask import Blueprint

teacher = Blueprint(
    "teacher",
    __name__,
    url_prefix="/api/teacher",
)

from . import routes
