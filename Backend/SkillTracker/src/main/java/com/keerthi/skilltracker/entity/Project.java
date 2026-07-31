package com.keerthi.skilltracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Project") // Matches SQL table[cite: 1]
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Project_ID")
    private Long projectId;

    @Column(name = "Project_Name", nullable = false)
    private String projectName;

    @Column(name = "Required_skills", columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(name = "Domain")
    private String domain;

    @Column(name = "open_position")
    private Integer openPosition = 1;

    public Project() {}

    // Getters and Setters
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(String requiredSkills) { this.requiredSkills = requiredSkills; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public Integer getOpenPosition() { return openPosition; }
    public void setOpenPosition(Integer openPosition) { this.openPosition = openPosition; }
}