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

import com.keerthi.skilltracker.entity.Certification;
import com.keerthi.skilltracker.repository.CertificationRepository;

@RestController
@RequestMapping("/api/certifications")
@CrossOrigin(origins = "*")
public class CertificationController {

    @Autowired
    private CertificationRepository certificationRepository;

    @GetMapping
    public List<Certification> getCertifications(@RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return certificationRepository.findByEmployeeId(employeeId);
        }
        return certificationRepository.findAll();
    }

    @PostMapping
    public Certification addCertification(@RequestBody Certification certification) {
        return certificationRepository.save(certification);
    }
}
