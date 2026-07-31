package com.keerthi.skilltracker.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.keerthi.skilltracker.entity.Employee;
import com.keerthi.skilltracker.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ─── REGISTER ──────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {

        String name       = (String) body.get("name");
        String email      = (String) body.get("email");
        String password   = (String) body.get("password");
        String department = (String) body.get("department");
        Object expObj     = body.get("experiences");

        // Basic validation
        if (name == null || name.isBlank() || email == null || email.isBlank()
                || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Name, email, and password are required."));
        }

        // Duplicate email check
        if (employeeRepository.existsByEmail(email.trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "An employee with this email already exists."));
        }

        // Build & save employee
        Employee employee = new Employee();
        employee.setName(name.trim());
        employee.setEmail(email.trim().toLowerCase());
        employee.setPassword(passwordEncoder.encode(password));
        employee.setDepartment(department != null ? department.trim() : null);
        employee.setExperiences(parseExperiences(expObj));
        employee.setBenchStatus("On Bench");

        Employee saved = employeeRepository.save(employee);

        // Return saved employee (without password hash)
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Registration successful");
        response.put("employee", sanitize(saved));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── LOGIN ─────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {

        String userId   = credentials.get("userId");
        String password = credentials.get("password");
        String role     = credentials.getOrDefault("role", "employee");

        if (userId == null || userId.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Employee ID and password are required."));
        }

        String trimmed = userId.trim();

        // ── Manager short-circuit ──────────────────────────
        if ("manager".equalsIgnoreCase(role)) {
            boolean emailOk    = "admin@benchbridge.com".equalsIgnoreCase(trimmed);
            boolean passwordOk = "Password@123".equals(password);

            if (!emailOk || !passwordOk) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Invalid manager credentials."));
            }

            Map<String, Object> managerResponse = new HashMap<>();
            managerResponse.put("token", "bb-manager-session-" + System.currentTimeMillis());
            managerResponse.put("employee", Map.of(
                "emplId", 0,
                "name", "Admin Manager",
                "email", "admin@benchbridge.com",
                "department", "Management",
                "experiences", 10,
                "benchStatus", "Active",
                "role", "manager"
            ));
            return ResponseEntity.ok(managerResponse);
        }

        // ── Employee lookup ────────────────────────────────

        // Look up employee by email, by Name, by numeric emplId, or by EMP-prefixed ID
        Optional<Employee> employeeOpt = employeeRepository.findByEmail(trimmed.toLowerCase());

        if (employeeOpt.isEmpty()) {
            employeeOpt = employeeRepository.findAll().stream()
                .filter(e -> {
                    String idStr = String.valueOf(e.getEmplId());
                    String empFormatted = "EMP" + String.format("%04d", e.getEmplId());
                    boolean matchName = e.getName() != null && e.getName().equalsIgnoreCase(trimmed);
                    return matchName || idStr.equals(trimmed) || empFormatted.equalsIgnoreCase(trimmed);
                })
                .findFirst();
        }

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "No employee found with this Name or ID. Please check your credentials or register first."));
        }

        Employee emp = employeeOpt.get();

        // Verify password
        if (emp.getPassword() == null || !passwordEncoder.matches(password, emp.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Invalid password. Please try again."));
        }

        // Success — return employee data (without password hash)
        Map<String, Object> response = new HashMap<>();
        response.put("token", "bb-session-" + emp.getEmplId() + "-" + System.currentTimeMillis());
        response.put("employee", sanitize(emp));
        return ResponseEntity.ok(response);
    }

    // ─── HELPERS ───────────────────────────────────────────

    /** Strip the password hash before sending employee data to the frontend. */
    private Map<String, Object> sanitize(Employee emp) {
        Map<String, Object> clean = new HashMap<>();
        clean.put("emplId", emp.getEmplId());
        clean.put("name", emp.getName());
        clean.put("email", emp.getEmail());
        clean.put("department", emp.getDepartment());
        clean.put("experiences", emp.getExperiences());
        clean.put("benchStatus", emp.getBenchStatus());
        return clean;
    }

    private Integer parseExperiences(Object obj) {
        if (obj == null) return 1;
        if (obj instanceof Number) return ((Number) obj).intValue();
        try { return Integer.parseInt(obj.toString()); } catch (NumberFormatException e) { return 1; }
    }
}

