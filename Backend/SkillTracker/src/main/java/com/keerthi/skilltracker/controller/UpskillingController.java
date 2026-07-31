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

import com.keerthi.skilltracker.entity.Upskilling;
import com.keerthi.skilltracker.repository.UpskillingRepository;

@RestController
@RequestMapping("/api/upskilling")
@CrossOrigin(origins = "*")
public class UpskillingController {

    @Autowired
    private UpskillingRepository upskillingRepository;

    @GetMapping
    public List<Upskilling> getUpskillingCourses(@RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return upskillingRepository.findByEmplId(employeeId);
        }
        return upskillingRepository.findAll();
    }

    @PostMapping
    public Upskilling addUpskillingCourse(@RequestBody Upskilling upskilling) {
        return upskillingRepository.save(upskilling);
    }
}
