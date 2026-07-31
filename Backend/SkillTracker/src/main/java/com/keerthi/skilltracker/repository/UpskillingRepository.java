package com.keerthi.skilltracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.keerthi.skilltracker.entity.Upskilling;

@Repository
public interface UpskillingRepository extends JpaRepository<Upskilling, Long> {
    List<Upskilling> findByEmplId(Long emplId);
}