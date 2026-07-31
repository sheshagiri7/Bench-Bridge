package com.keerthi.skilltracker.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Assessment") // Matches SQL table name
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assessment_id") // Matches SQL column
    private Long assessmentId;

    @Column(name = "employee_id") // Matches SQL column[cite: 1]
    private Long employeeId;

    @Column(name = "technology", nullable = false) // Matches SQL column[cite: 1]
    private String technology;

    @Column(name = "score") // Matches SQL column[cite: 1]
    private BigDecimal score;

    @Column(name = "date") // Matches SQL column[cite: 1]
    private LocalDate date;

    public Assessment() {}

    public Assessment(Long employeeId, String technology, BigDecimal score, LocalDate date) {
        this.employeeId = employeeId;
        this.technology = technology;
        this.score = score;
        this.date = date;
    }

    // Getters and Setters
    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getTechnology() { return technology; }
    public void setTechnology(String technology) { this.technology = technology; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}