package com.keerthi.skilltracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Skills") // Matches SQL table
public class Skills {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "skill_id")
    private Long skillId;

    @Column(name = "Empl_Id")
    private Long emplId;

    @Column(name = "Skill_name", nullable = false)
    private String skillName;

    @Column(name = "Skill_levels")
    private String skillLevels;

    public Skills() {}

    // Getters and Setters
    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }
    public Long getEmplId() { return emplId; }
    public void setEmplId(Long emplId) { this.emplId = emplId; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public String getSkillLevels() { return skillLevels; }
    public void setSkillLevels(String skillLevels) { this.skillLevels = skillLevels; }
}