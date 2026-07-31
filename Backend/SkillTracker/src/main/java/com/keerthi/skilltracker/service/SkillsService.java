package com.keerthi.skilltracker.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.keerthi.skilltracker.entity.Skills;
import com.keerthi.skilltracker.repository.SkillsRepository;

@Service
public class SkillsService {

    @Autowired
    private SkillsRepository skillsRepository;

    public List<Skills> getAllSkills() {
        return skillsRepository.findAll();
    }

    public List<Skills> getSkillsByEmployeeId(Long emplId) {
        return skillsRepository.findByEmplId(emplId);
    }

    public Skills addSkill(Skills skill) {
        return skillsRepository.save(skill);
    }

    public void deleteSkill(Long skillId) {
        skillsRepository.deleteById(skillId);
    }
}
