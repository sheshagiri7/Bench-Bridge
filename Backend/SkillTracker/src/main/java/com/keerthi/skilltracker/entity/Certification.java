package com.keerthi.skilltracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Certification") // Matches SQL table[cite: 1]
public class Certification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Certification_id")
    private Long certificationId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "Certification_name", nullable = false)
    private String certificationName;

    @Column(name = "Cloudinary_url", columnDefinition = "TEXT")
    private String cloudinaryUrl;

    @Column(name = "Status")
    private String status;

    public Certification() {}

    // Getters and Setters
    public Long getCertificationId() { return certificationId; }
    public void setCertificationId(Long certificationId) { this.certificationId = certificationId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getCertificationName() { return certificationName; }
    public void setCertificationName(String certificationName) { this.certificationName = certificationName; }
    public String getCloudinaryUrl() { return cloudinaryUrl; }
    public void setCloudinaryUrl(String cloudinaryUrl) { this.cloudinaryUrl = cloudinaryUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}