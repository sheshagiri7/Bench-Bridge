package com.keerthi.skilltracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.keerthi.skilltracker.entity.ProjectMatch;

@Repository
public interface ProjectMatchRepository extends JpaRepository<ProjectMatch, Long> {
    List<ProjectMatch> findByEmployeeId(Long employeeId);
    Optional<ProjectMatch> findByEmployeeIdAndProjectId(Long employeeId, Long projectId);
}