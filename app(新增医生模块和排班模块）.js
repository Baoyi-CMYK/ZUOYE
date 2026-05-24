let currentUser = null;

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById(pageName + 'Page');
    if (page) page.classList.remove('hidden');
    
    if (pageName === 'home') updateWelcomeTitle();
    if (pageName === 'departments') loadDepartments();
    if (pageName === 'doctors') { loadDepartmentsForFilter(); loadDoctors(); }
    if (pageName === 'schedules') { loadDepartmentsForSchedule(); loadSchedules(); }
    if (pageName === 'addSchedule') loadDeptsForScheduleForm();
}

function updateWelcomeTitle() {
    const title = document.getElementById('welcomeTitle');
    if (title) {
        title.textContent = currentUser 
            ? `${currentUser.real_name || currentUser.username}，欢迎您使用医院挂号系统`
            : '欢迎使用医院挂号系统';
    }
}

function updateNav() {
    const nav = document.getElementById('navBar');
    if (!nav) return;
    
    if (currentUser) {
        nav.innerHTML = `
            <a href="#home" onclick="showPage('home')">首页</a>
            <a href="#departments" onclick="showPage('departments')">科室管理</a>
            <a href="#doctors" onclick="showPage('doctors')">医生管理</a>
            <a href="#schedules" onclick="showPage('schedules')">排班管理</a>
            <a href="#logout" onclick="logout(); return false;">退出</a>
        `;
    } else {
        nav.innerHTML = `
            <a href="#home" onclick="showPage('home')">首页</a>
            <a href="#login" onclick="showPage('login')">登录</a>
            <a href="#register" onclick="showPage('register')">注册</a>
        `;
    }
}

function showAlert(containerId, message, type = 'success') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 3000);
}

async function logout() {
    await api.auth.logout();
    currentUser = null;
    updateNav();
    showPage('home');
}

async function loadDepartments() {
    const result = await api.departments.list();
    if (result.success) {
        const grid = document.getElementById('deptsGrid');
        grid.innerHTML = result.data.map(dept => `
            <div class="card">
                <div class="card-title">${dept.name}</div>
                <p>代码: ${dept.code}</p>
                <p>${dept.description || '暂无描述'}</p>
                <button class="btn btn-danger btn-sm" onclick="deleteDept(${dept.id})">删除</button>
            </div>
        `).join('');
    }
}

async function loadDepartmentsForFilter() {
    const result = await api.departments.list();
    if (result.success) {
        const filter = document.getElementById('deptFilter');
        const deptSelect = document.getElementById('doctorDeptSelect');
        const options = result.data.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        if (filter) filter.innerHTML = '<option value="">全部科室</option>' + options;
        if (deptSelect) deptSelect.innerHTML = '<option value="">请选择科室</option>' + options;
    }
}

async function loadDepartmentsForSchedule() {
    const result = await api.departments.list();
    if (result.success) {
        const filter = document.getElementById('scheduleDeptFilter');
        const deptSelect = document.getElementById('scheduleDeptSelect');
        const options = result.data.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        if (filter) filter.innerHTML = '<option value="">全部科室</option>' + options;
        if (deptSelect) deptSelect.innerHTML = '<option value="">请选择科室</option>' + options;
    }
}

async function loadDoctorsForScheduleSelect() {
    const deptId = document.getElementById('scheduleDeptSelect').value;
    if (!deptId) return;
    const result = await api.doctors.list({ department_id: deptId });
    const select = document.getElementById('scheduleDoctorSelect');
    if (result.success && select) {
        select.innerHTML = '<option value="">请选择医生</option>' + 
            result.data.map(d => `<option value="${d.id}">${d.real_name} - ${d.title}</option>`).join('');
    }
}

async function loadDoctorsForSchedule() {
    const deptId = document.getElementById('scheduleDeptFilter').value;
    const result = deptId ? await api.doctors.list({ department_id: deptId }) : await api.doctors.list();
    const filter = document.getElementById('scheduleDoctorFilter');
    if (result.success && filter) {
        filter.innerHTML = '<option value="">全部医生</option>' + 
            result.data.map(d => `<option value="${d.id}">${d.real_name}</option>`).join('');
    }
}

async function loadDoctors() {
    const deptId = document.getElementById('deptFilter')?.value;
    const params = deptId ? { department_id: deptId } : {};
    const result = await api.doctors.list(params);
    const grid = document.getElementById('doctorsGrid');
    if (result.success && grid) {
        grid.innerHTML = result.data.length === 0 ? '<p>暂无医生</p>' :
            result.data.map(doc => `
                <div class="card">
                    <div class="card-title">${doc.real_name}</div>
                    <p>科室: ${doc.department_name}</p>
                    <p>职称: ${doc.title || '暂无'}</p>
                    <p>专长: ${doc.specialty || '暂无'}</p>
                    <button class="btn btn-danger btn-sm" onclick="deleteDoctor(${doc.id})">删除</button>
                </div>
            `).join('');
    }
}

async function loadSchedules() {
    const doctorId = document.getElementById('scheduleDoctorFilter')?.value;
    const params = doctorId ? { doctor_id: doctorId } : {};
    const result = await api.schedules.list(params);
    const grid = document.getElementById('schedulesGrid');
    if (result.success && grid) {
        grid.innerHTML = result.data.length === 0 ? '<p>暂无排班</p>' :
            result.data.map(sch => `
                <div class="card">
                    <div class="card-title">${sch.doctor_name}</div>
                    <p>科室: ${sch.department_name}</p>
                    <p>日期: ${sch.date}</p>
                    <p>时段: ${sch.time_period}</p>
                    <p>剩余号源: ${sch.remaining_slots}/${sch.total_slots}</p>
                    <p>状态: ${sch.status}</p>
                    <button class="btn btn-danger btn-sm" onclick="deleteSchedule(${sch.id})">删除</button>
                </div>
            `).join('');
    }
}

async function deleteDept(id) {
    if (!confirm('确定删除？')) return;
    const result = await api.departments.delete(id);
    if (result.success) { showAlert('deptAlert', '删除成功'); loadDepartments(); }
}

async function deleteDoctor(id) {
    if (!confirm('确定删除？')) return;
    const result = await api.doctors.delete(id);
    if (result.success) { showAlert('doctorAlert', '删除成功'); loadDoctors(); }
}

async function deleteSchedule(id) {
    if (!confirm('确定删除？')) return;
    const result = await api.schedules.delete(id);
    if (result.success) { showAlert('scheduleAlert', '删除成功'); loadSchedules(); }
}

document.addEventListener('DOMContentLoaded', async () => {
    const result = await api.auth.currentUser();
    if (result.success) currentUser = result.data;
    updateNav();
    updateWelcomeTitle();

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.auth.login({
            username: formData.get('username'),
            password: formData.get('password'),
        });
        if (result.success) {
            currentUser = result.data;
            updateNav();
            showAlert('loginAlert', '登录成功！');
            setTimeout(() => showPage('home'), 1000);
        } else {
            showAlert('loginAlert', result.message, 'error');
        }
    });

    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.auth.register({
            username: formData.get('username'),
            password: formData.get('password'),
            real_name: formData.get('real_name'),
            id_card: formData.get('id_card'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            role: 'patient',
        });
        if (result.success) {
            showAlert('registerAlert', '注册成功！请登录');
            setTimeout(() => showPage('login'), 1500);
        } else {
            showAlert('registerAlert', result.message, 'error');
        }
    });

    document.getElementById('addDeptForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.departments.create({
            name: formData.get('name'),
            code: formData.get('code'),
            description: formData.get('description')
        });
        if (result.success) {
            showAlert('deptAlert', '添加成功');
            setTimeout(() => showPage('departments'), 1000);
        } else {
            showAlert('deptAlert', result.message, 'error');
        }
    });

    document.getElementById('addDoctorForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.doctors.create({
            department_id: formData.get('department_id'),
            title: formData.get('title'),
            specialty: formData.get('specialty'),
            intro: formData.get('intro')
        });
        if (result.success) {
            showAlert('doctorAlert', '添加成功');
            setTimeout(() => showPage('doctors'), 1000);
        } else {
            showAlert('doctorAlert', result.message, 'error');
        }
    });

    document.getElementById('addScheduleForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.schedules.create({
            doctor_id: formData.get('doctor_id'),
            date: formData.get('date'),
            time_period: formData.get('time_period'),
            total_slots: formData.get('total_slots'),
            remaining_slots: formData.get('total_slots')
        });
        if (result.success) {
            showAlert('scheduleAlert', '添加成功');
            setTimeout(() => showPage('schedules'), 1000);
        } else {
            showAlert('scheduleAlert', result.message, 'error');
        }
    });
});