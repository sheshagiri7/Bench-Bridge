package com.keerthi.skilltracker.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.keerthi.skilltracker.entity.ProjectMatch;
import com.keerthi.skilltracker.repository.ProjectMatchRepository;

@Service
public class ProjectMatchService {

    @Autowired
    private ProjectMatchRepository projectMatchRepository;

    public List<ProjectMatch> getMatchesByEmployeeId(Long employeeId) {
        return projectMatchRepository.findByEmployeeId(employeeId);
    }

    public List<ProjectMatch> getAllMatches() {
        return projectMatchRepository.findAll();
    }

    public ProjectMatch saveMatch(ProjectMatch projectMatch) {
        Optional<ProjectMatch> existing = projectMatchRepository.findByEmployeeIdAndProjectId(
                projectMatch.getEmployeeId(), projectMatch.getProjectId());
        if (existing.isPresent()) {
            ProjectMatch match = existing.get();
            if (projectMatch.getStatus() != null) match.setStatus(projectMatch.getStatus());
            if (projectMatch.getMatchScore() != null) match.setMatchScore(projectMatch.getMatchScore());
            return projectMatchRepository.save(match);
        }
        return projectMatchRepository.save(projectMatch);
    }
}
