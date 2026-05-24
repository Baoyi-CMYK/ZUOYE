let currentUser = null;

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName + 'Page').classList.remove('hidden');
    
    if (pageName === 'home') updateWelcomeTitle();
    if (pageName === 'departments') loadDepartments();
}

function updateWelcomeTitle() {
    const title = document.getElementById('welcomeTitle');
    if (currentUser) {
        title.textContent = `${currentUser.real_name || currentUser.username}，欢迎您使用医院挂号系统`;
    } else {
        title.textContent = '欢迎使用医院挂号系统';
    }
}

function updateNav() {
    const nav = document.getElementById('navBar');
    if (currentUser) {
        nav.innerHTML = `
            <a href="#home" onclick="showPage('home')">首页</a>
            <a href="#departments" onclick="showPage('departments')">科室管理</a>
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
    
    container.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
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
                <div style="margin-top: 1rem;">
                    <button class="btn btn-danger btn-sm" onclick="deleteDept(${dept.id})">删除</button>
                </div>
            </div>
        `).join('');
    }
}

function showAddDeptForm() {
    showPage('addDept');
}

async function deleteDept(id) {
    if (!confirm('确定删除此科室吗？')) return;
    const result = await api.departments.delete(id);
    if (result.success) {
        showAlert('deptAlert', '删除成功', 'success');
        loadDepartments();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const result = await api.auth.currentUser();
    if (result.success) {
        currentUser = result.data;
    }
    updateNav();
    updateWelcomeTitle();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const result = await api.auth.login({
                username: formData.get('username'),
                password: formData.get('password'),
            });
            
            if (result.success) {
                currentUser = result.data;
                updateNav();
                showAlert('loginAlert', '登录成功！', 'success');
                setTimeout(() => showPage('home'), 1000);
            } else {
                showAlert('loginAlert', result.message, 'error');
            }
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
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
                showAlert('registerAlert', '注册成功！请登录', 'success');
                setTimeout(() => showPage('login'), 1500);
            } else {
                showAlert('registerAlert', result.message, 'error');
            }
        });
    }
    
    const addDeptForm = document.getElementById('addDeptForm');
    if (addDeptForm) {
        addDeptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const result = await api.departments.create({
                name: formData.get('name'),
                code: formData.get('code'),
                description: formData.get('description')
            });
            
            if (result.success) {
                showAlert('deptAlert', '添加成功', 'success');
                setTimeout(() => showPage('departments'), 1000);
            } else {
                showAlert('deptAlert', result.message, 'error');
            }
        });
    }
});