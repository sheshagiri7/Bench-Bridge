package com.keerthi.skilltracker.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.keerthi.skilltracker.entity.Employee;
import com.keerthi.skilltracker.repository.EmployeeRepository;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id " + id));
        
        if (employeeDetails.getName() != null) employee.setName(employeeDetails.getName());
        if (employeeDetails.getEmail() != null) employee.setEmail(employeeDetails.getEmail());
        if (employeeDetails.getDepartment() != null) employee.setDepartment(employeeDetails.getDepartment());
        if (employeeDetails.getExperiences() != null) employee.setExperiences(employeeDetails.getExperiences());
        if (employeeDetails.getBenchStatus() != null) employee.setBenchStatus(employeeDetails.getBenchStatus());

        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }
}
