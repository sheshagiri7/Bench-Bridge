// Sample initial data matching your SQL database
const employeesData = [
    { id: 'E101', name: 'kaviya', dept: 'Engineering', skill: 'Python', score: 88.5, status: 'On Bench' },
    { id: 'E102', name: 'kavi', dept: 'Data Science', skill: 'Machine Learning', score: 94.0, status: 'On Bench' },
    { id: 'E103', name: 'David ', dept: 'Cloud Services', skill: 'AWS', score: 91.0, status: 'Assigned' },
    { id: 'E104', name: 'Sophia ', dept: 'Frontend', skill: 'React', score: 82.0, status: 'On Bench' },
    { id: 'E105', name: 'Rahul ', dept: 'Backend', skill: 'Java', score: 90.0, status: 'Assigned' },
    { id: 'E106', name: 'Lakshmi ', dept: 'Engineering', skill: 'SQL', score: 85.0, status: 'On Bench' }
];

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    updateCounts();
    renderTable(employeesData);
});

// Calculate metrics numbers
function updateCounts() {
    const total = employeesData.length;
    const bench = employeesData.filter(e => e.status === 'On Bench').length;
    const highScore = employeesData.filter(e => e.score >= 85).length;

    document.getElementById('totalCount').innerText = total;
    document.getElementById('benchCount').innerText = bench;
    document.getElementById('highScoreCount').innerText = highScore;
}

// Render data into the table
function renderTable(data) {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:24px;">No employees found</td></tr>`;
        return;
    }

    data.forEach(emp => {
        const isBench = emp.status === 'On Bench';
        const isHighScore = emp.score >= 85;

        const row = `
            <tr>
                <td><span class="emp-id">${emp.id}</span></td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.dept}</td>
                <td><span class="skill-tag">${emp.skill}</span></td>
                <td>
                    <span class="score-badge ${isHighScore ? 'high' : 'normal'}">
                        ${emp.score}%
                    </span>
                </td>
                <td>
                    <span class="status-badge ${isBench ? 'bench' : 'project'}">
                        ${emp.status}
                    </span>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Filter table on clicking cards
function filterData(type) {
    currentFilter = type;
    document.getElementById('searchInput').value = '';

    // Active Card Styling
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active-card'));

    let filtered = [];
    const title = document.getElementById('tableTitle');
    const subtitle = document.getElementById('tableSubtitle');

    if (type === 'bench') {
        document.getElementById('cardBench').classList.add('active-card');
        filtered = employeesData.filter(e => e.status === 'On Bench');
        title.innerText = 'Bench Employees';
        subtitle.innerText = 'List of available employees on bench';
    } else if (type === 'high') {
        document.getElementById('cardHigh').classList.add('active-card');
        filtered = employeesData.filter(e => e.score >= 85);
        title.innerText = 'Higher Score Employees';
        subtitle.innerText = 'Employees with assessment score 85% or above';
    } else {
        document.getElementById('cardTotal').classList.add('active-card');
        filtered = employeesData;
        title.innerText = 'All Employees';
        subtitle.innerText = 'Showing all registered employees';
    }

    renderTable(filtered);
}

// Real-time Search Filter
function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    let baseList = employeesData;
    if (currentFilter === 'bench') baseList = employeesData.filter(e => e.status === 'On Bench');
    if (currentFilter === 'high') baseList = employeesData.filter(e => e.score >= 85);

    const result = baseList.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.dept.toLowerCase().includes(query) ||
        e.skill.toLowerCase().includes(query) ||
        e.id.toLowerCase().includes(query)
    );

    renderTable(result);
}