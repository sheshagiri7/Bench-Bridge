package com.keerthi.skilltracker.config;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.keerthi.skilltracker.entity.Assessment;
import com.keerthi.skilltracker.entity.Employee;
import com.keerthi.skilltracker.entity.Project;
import com.keerthi.skilltracker.entity.ProjectMatch;
import com.keerthi.skilltracker.entity.Skills;
import com.keerthi.skilltracker.repository.AssessmentRepository;
import com.keerthi.skilltracker.repository.EmployeeRepository;
import com.keerthi.skilltracker.repository.ProjectMatchRepository;
import com.keerthi.skilltracker.repository.ProjectRepository;
import com.keerthi.skilltracker.repository.SkillsRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private SkillsRepository skillsRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMatchRepository projectMatchRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (employeeRepository.count() == 0) {
            // No default employees pre-seeded — table populates strictly via registration

            // Seed Projects
            Project p1 = new Project();
            p1.setProjectName("AI Banking Portal");
            p1.setRequiredSkills("Java, Spring Boot, SQL, React");
            p1.setDomain("FinTech");
            p1.setOpenPosition(3);
            p1 = projectRepository.save(p1);

            Project p2 = new Project();
            p2.setProjectName("Cloud Migration Suite");
            p2.setRequiredSkills("Java, Docker, Kubernetes, Spring Boot");
            p2.setDomain("Cloud Infrastructure");
            p2.setOpenPosition(2);
            p2 = projectRepository.save(p2);

            Project p3 = new Project();
            p3.setProjectName("Data Insights Hub");
            p3.setRequiredSkills("Python, SQL, Machine Learning, React");
            p3.setDomain("Data & Analytics");
            p3.setOpenPosition(4);
            p3 = projectRepository.save(p3);

            // Project matches generated dynamically when employees apply for projects

            System.out.println("[BenchBridge DataInitializer] Seeded initial database records successfully.");
        }
    }

    private Skills createSkill(Long emplId, String name, String level) {
        Skills skill = new Skills();
        skill.setEmplId(emplId);
        skill.setSkillName(name);
        skill.setSkillLevels(level);
        return skill;
    }
}
