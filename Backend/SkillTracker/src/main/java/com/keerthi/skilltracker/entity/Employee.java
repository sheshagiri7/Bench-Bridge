package com.keerthi.skilltracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Employee") // Matches SQL table
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Empl_Id") // Matches SQL column
    private Long emplId;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Email", unique = true, nullable = false)
    private String email;

    @Column(name = "Department")
    private String department;

    @Column(name = "Experiences")
    private Integer experiences;

    @Column(name = "Bench_status")
    private String benchStatus = "On Bench"; // Matches SQL default

    @Column(name = "password")
    private String password; // BCrypt-hashed; nullable so existing rows are unaffected

    public Employee() {}

    // Getters and Setters
    public Long getEmplId() { return emplId; }
    public void setEmplId(Long emplId) { this.emplId = emplId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Integer getExperiences() { return experiences; }
    public void setExperiences(Integer experiences) { this.experiences = experiences; }
    public String getBenchStatus() { return benchStatus; }
    public void setBenchStatus(String benchStatus) { this.benchStatus = benchStatus; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}