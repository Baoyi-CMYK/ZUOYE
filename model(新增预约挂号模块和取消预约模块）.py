from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='patient')
    real_name = db.Column(db.String(100))
    id_card = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'real_name': self.real_name,
            'id_card': self.id_card,
            'phone': self.phone,
            'email': self.email,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description
        }

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    title = db.Column(db.String(50))
    specialty = db.Column(db.String(200))
    intro = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)

    user = db.relationship('User', backref='doctor_profile')
    department = db.relationship('Department', backref='doctors')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'title': self.title,
            'specialty': self.specialty,
            'intro': self.intro,
            'real_name': self.user.real_name if self.user else None
        }

class Schedule(db.Model):
    __tablename__ = 'schedules'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'))
    date = db.Column(db.Date, nullable=False)
    time_period = db.Column(db.String(20), nullable=False)
    total_slots = db.Column(db.Integer, default=20)
    remaining_slots = db.Column(db.Integer, default=20)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.now)

    doctor = db.relationship('Doctor', backref='schedules')

    def to_dict(self):
        return {
            'id': self.id,
            'doctor_id': self.doctor_id,
            'doctor_name': self.doctor.user.real_name if self.doctor and self.doctor.user else None,
            'department_id': self.doctor.department_id if self.doctor else None,
            'department_name': self.doctor.department.name if self.doctor and self.doctor.department else None,
            'date': self.date.strftime('%Y-%m-%d') if self.date else None,
            'time_period': self.time_period,
            'total_slots': self.total_slots,
            'remaining_slots': self.remaining_slots,
            'status': self.status
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedules.id'), nullable=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'))
    appointment_date = db.Column(db.Date, nullable=False)
    time_period = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='confirmed')
    order_no = db.Column(db.String(50), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.now)

    patient = db.relationship('User', backref='appointments')
    schedule = db.relationship('Schedule', backref='appointments')
    doctor = db.relationship('Doctor', backref='appointments')

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient.real_name if self.patient else None,
            'schedule_id': self.schedule_id,
            'doctor_id': self.doctor_id,
            'doctor_name': self.doctor.user.real_name if self.doctor and self.doctor.user else None,
            'department_id': self.doctor.department_id if self.doctor else None,
            'department_name': self.doctor.department.name if self.doctor and self.doctor.department else None,
            'appointment_date': self.appointment_date.strftime('%Y-%m-%d') if self.appointment_date else None,
            'time_period': self.time_period,
            'status': self.status,
            'order_no': self.order_no,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }