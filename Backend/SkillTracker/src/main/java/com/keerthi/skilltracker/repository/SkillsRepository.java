package com.keerthi.skilltracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.keerthi.skilltracker.entity.Skills;

@Repository
public interface SkillsRepository extends JpaRepository<Skills, Long> {
    List<Skills> findByEmplId(Long emplId);
}