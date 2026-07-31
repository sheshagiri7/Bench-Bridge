package com.keerthi.skilltracker.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.keerthi.skilltracker.entity.Skills;
import com.keerthi.skilltracker.service.SkillsService;

@RestController
@RequestMapping("/api/skills")
@CrossOrigin(origins = "*")
public class SkillsController {

    @Autowired
    private SkillsService skillsService;

    @GetMapping
    public List<Skills> getSkills(@RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return skillsService.getSkillsByEmployeeId(employeeId);
        }
        return skillsService.getAllSkills();
    }

    @PostMapping
    public Skills addSkill(@RequestBody Skills skill) {
        return skillsService.addSkill(skill);
    }
}
