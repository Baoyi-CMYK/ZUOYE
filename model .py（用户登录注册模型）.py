from flask_sqlalchemy import SQLAlchemy
from datetime import datetime  # 添加导入

db = SQLAlchemy()

class User(db.Model):  # 添加类定义
    __tablename__ = 'users'  # 表名
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # patient, doctor, admin
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