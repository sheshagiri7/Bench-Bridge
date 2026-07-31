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

import com.keerthi.skilltracker.entity.ProjectMatch;
import com.keerthi.skilltracker.service.ProjectMatchService;

@RestController
@RequestMapping("/api/project-matches")
@CrossOrigin(origins = "*")
public class ProjectMatchController {

    @Autowired
    private ProjectMatchService projectMatchService;

    @GetMapping
    public List<ProjectMatch> getProjectMatches(
            @RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return projectMatchService.getMatchesByEmployeeId(employeeId);
        }
        return projectMatchService.getAllMatches();
    }

    @PostMapping
    public ProjectMatch saveProjectMatch(@RequestBody ProjectMatch projectMatch) {
        return projectMatchService.saveMatch(projectMatch);
    }
}
