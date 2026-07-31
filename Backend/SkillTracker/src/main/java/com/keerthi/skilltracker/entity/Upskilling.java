package com.keerthi.skilltracker.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Upskilling") // Matches SQL table[cite: 1]
public class Upskilling {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Course_Id")
    private Long courseId;

    @Column(name = "Empl_id")
    private Long emplId;

    @Column(name = "Course_name", nullable = false)
    private String courseName;

    @Column(name = "Status")
    private String status;

    @Column(name = "Completion_Date")
    private LocalDate completionDate;

    public Upskilling() {}

    // Getters and Setters
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public Long getEmplId() { return emplId; }
    public void setEmplId(Long emplId) { this.emplId = emplId; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getCompletionDate() { return completionDate; }
    public void setCompletionDate(LocalDate completionDate) { this.completionDate = completionDate; }
}