// ProjectRepository.java
package com.keerthi.skilltracker.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.keerthi.skilltracker.entity.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {}