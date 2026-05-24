from flask import Flask, request, jsonify, session, render_template
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Department, Doctor, Schedule
from datetime import datetime, timedelta

app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/static')
app.config['SECRET_KEY'] = 'hospital_registration_system_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hospital.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app, supports_credentials=True)
db.init_app(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    user = User(
        username=data.get('username'),
        password=generate_password_hash(data.get('password')),
        role=data.get('role', 'patient'),
        real_name=data.get('real_name'),
        id_card=data.get('id_card'),
        phone=data.get('phone'),
        email=data.get('email')
    )
    if User.query.filter_by(username=user.username).first():
        return jsonify({'success': False, 'message': '用户名已存在'})
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'message': '注册成功', 'data': user.to_dict()})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    if not user or not check_password_hash(user.password, data.get('password')):
        return jsonify({'success': False, 'message': '用户名或密码错误'})
    session['user_id'] = user.id
    session['username'] = user.username
    session['role'] = user.role
    return jsonify({'success': True, 'message': '登录成功', 'data': user.to_dict()})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': '退出登录成功'})

@app.route('/api/auth/current-user', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '未登录'})
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'})
    return jsonify({'success': True, 'data': user.to_dict()})

@app.route('/api/auth/update-profile', methods=['POST'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '未登录'})
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'})
    data = request.get_json()
    if 'real_name' in data: user.real_name = data['real_name']
    if 'id_card' in data: user.id_card = data['id_card']
    if 'phone' in data: user.phone = data['phone']
    if 'email' in data: user.email = data['email']
    if 'password' in data and data['password']:
        user.password = generate_password_hash(data['password'])
    db.session.commit()
    return jsonify({'success': True, 'message': '更新成功', 'data': user.to_dict()})

@app.route('/api/departments', methods=['GET'])
def get_departments():
    departments = Department.query.all()
    return jsonify({'success': True, 'data': [d.to_dict() for d in departments]})

@app.route('/api/departments', methods=['POST'])
def create_department():
    data = request.get_json()
    department = Department(name=data.get('name'), code=data.get('code'), description=data.get('description'))
    if Department.query.filter_by(code=department.code).first():
        return jsonify({'success': False, 'message': '科室代码已存在'})
    db.session.add(department)
    db.session.commit()
    return jsonify({'success': True, 'message': '科室创建成功', 'data': department.to_dict()})

@app.route('/api/departments/<int:dep_id>', methods=['PUT'])
def update_department(dep_id):
    department = Department.query.get(dep_id)
    if not department:
        return jsonify({'success': False, 'message': '科室不存在'})
    data = request.get_json()
    if 'name' in data: department.name = data['name']
    if 'code' in data: department.code = data['code']
    if 'description' in data: department.description = data['description']
    db.session.commit()
    return jsonify({'success': True, 'message': '科室更新成功', 'data': department.to_dict()})

@app.route('/api/departments/<int:dep_id>', methods=['DELETE'])
def delete_department(dep_id):
    department = Department.query.get(dep_id)
    if not department:
        return jsonify({'success': False, 'message': '科室不存在'})
    db.session.delete(department)
    db.session.commit()
    return jsonify({'success': True, 'message': '科室删除成功'})

@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    department_id = request.args.get('department_id')
    query = Doctor.query
    if department_id:
        query = query.filter_by(department_id=department_id)
    doctors = query.all()
    return jsonify({'success': True, 'data': [d.to_dict() for d in doctors]})

@app.route('/api/doctors', methods=['POST'])
def create_doctor():
    data = request.get_json()
    doctor = Doctor(
        user_id=data.get('user_id'),
        department_id=data.get('department_id'),
        title=data.get('title'),
        specialty=data.get('specialty'),
        intro=data.get('intro')
    )
    db.session.add(doctor)
    db.session.commit()
    return jsonify({'success': True, 'message': '医生创建成功', 'data': doctor.to_dict()})

@app.route('/api/doctors/<int:doc_id>', methods=['PUT'])
def update_doctor(doc_id):
    doctor = Doctor.query.get(doc_id)
    if not doctor:
        return jsonify({'success': False, 'message': '医生不存在'})
    data = request.get_json()
    if 'department_id' in data: doctor.department_id = data['department_id']
    if 'title' in data: doctor.title = data['title']
    if 'specialty' in data: doctor.specialty = data['specialty']
    if 'intro' in data: doctor.intro = data['intro']
    db.session.commit()
    return jsonify({'success': True, 'message': '医生更新成功', 'data': doctor.to_dict()})

@app.route('/api/doctors/<int:doc_id>', methods=['DELETE'])
def delete_doctor(doc_id):
    doctor = Doctor.query.get(doc_id)
    if not doctor:
        return jsonify({'success': False, 'message': '医生不存在'})
    db.session.delete(doctor)
    db.session.commit()
    return jsonify({'success': True, 'message': '医生删除成功'})

@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    doctor_id = request.args.get('doctor_id')
    date = request.args.get('date')
    status = request.args.get('status')
    query = Schedule.query
    if doctor_id:
        query = query.filter_by(doctor_id=doctor_id)
    if date:
        query = query.filter_by(date=datetime.strptime(date, '%Y-%m-%d').date())
    if status:
        query = query.filter_by(status=status)
    schedules = query.all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in schedules]})

@app.route('/api/schedules', methods=['POST'])
def create_schedule():
    data = request.get_json()
    schedule = Schedule(
        doctor_id=data.get('doctor_id'),
        date=datetime.strptime(data.get('date'), '%Y-%m-%d').date(),
        time_period=data.get('time_period'),
        total_slots=data.get('total_slots', 20),
        remaining_slots=data.get('remaining_slots', 20),
        status=data.get('status', 'active')
    )
    db.session.add(schedule)
    db.session.commit()
    return jsonify({'success': True, 'message': '排班创建成功', 'data': schedule.to_dict()})

@app.route('/api/schedules/<int:sch_id>', methods=['PUT'])
def update_schedule(sch_id):
    schedule = Schedule.query.get(sch_id)
    if not schedule:
        return jsonify({'success': False, 'message': '排班不存在'})
    data = request.get_json()
    if 'date' in data: schedule.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if 'time_period' in data: schedule.time_period = data['time_period']
    if 'total_slots' in data: schedule.total_slots = data['total_slots']
    if 'remaining_slots' in data: schedule.remaining_slots = data['remaining_slots']
    if 'status' in data: schedule.status = data['status']
    db.session.commit()
    return jsonify({'success': True, 'message': '排班更新成功', 'data': schedule.to_dict()})

@app.route('/api/schedules/<int:sch_id>', methods=['DELETE'])
def delete_schedule(sch_id):
    schedule = Schedule.query.get(sch_id)
    if not schedule:
        return jsonify({'success': False, 'message': '排班不存在'})
    db.session.delete(schedule)
    db.session.commit()
    return jsonify({'success': True, 'message': '排班删除成功'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', password=generate_password_hash('admin123'), role='admin', real_name='管理员')
            db.session.add(admin)
            db.session.commit()
    app.run(debug=True, host='0.0.0.0', port=5000)