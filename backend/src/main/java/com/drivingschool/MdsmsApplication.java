package com.drivingschool;

import com.drivingschool.model.*;
import com.drivingschool.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MdsmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(MdsmsApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository,
            CandidateProfileRepository candidateProfileRepository,
            MoniteurProfileRepository moniteurProfileRepository,
            VehicleRepository vehicleRepository,
            NarsaQuotaRepository narsaQuotaRepository,
            CaisseTransactionRepository caisseTransactionRepository,
            LearningPostSlotRepository learningPostSlotRepository,
            DrivingLessonSlotRepository drivingLessonSlotRepository,
            FuelRecordRepository fuelRecordRepository,
            PaySlipRepository paySlipRepository,
            ProspectRepository prospectRepository,
            SupportLessonRepository supportLessonRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            // 1. Create Core Users & Moniteur Profiles if missing
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@autoecolekarima.ma");
                admin.setFullName("Chakib (Directeur)");
                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                admin.setCreatedAt(LocalDateTime.now());
                userRepository.save(admin);
            }

            if (userRepository.findByUsername("assistant").isEmpty()) {
                User assistant = new User();
                assistant.setUsername("assistant");
                assistant.setPassword(passwordEncoder.encode("assistant123"));
                assistant.setEmail("assistant@autoecolekarima.ma");
                assistant.setFullName("Karima (Assistant)");
                assistant.setRole(Role.ASSISTANT);
                assistant.setActive(true);
                assistant.setCreatedAt(LocalDateTime.now());
                userRepository.save(assistant);
            }

            if (userRepository.findByUsername("youssef").isEmpty()) {
                User instructor1 = new User();
                instructor1.setUsername("youssef");
                instructor1.setPassword(passwordEncoder.encode("youssef123"));
                instructor1.setEmail("youssef.moniteur@gmail.com");
                instructor1.setFullName("Youssef El Alami");
                instructor1.setRole(Role.MONITEUR);
                instructor1.setActive(true);
                instructor1.setCreatedAt(LocalDateTime.now());

                MoniteurProfile profile1 = new MoniteurProfile();
                profile1.setUser(instructor1);
                profile1.setPhone("0611223344");
                profile1.setCapNumber("CAP-2024-887");
                profile1.setCapExpiryDate(LocalDate.now().plusMonths(8));
                profile1.setPayFrequency("MONTHLY");
                profile1.setHourlyRate(50.0);
                profile1.setFixedSalary(1500.0);
                profile1.setBonusPerExamSuccess(50.0);
                moniteurProfileRepository.save(profile1);
            }

            if (userRepository.findByUsername("samir").isEmpty()) {
                User instructor2 = new User();
                instructor2.setUsername("samir");
                instructor2.setPassword(passwordEncoder.encode("samir123"));
                instructor2.setEmail("samir.moniteur@gmail.com");
                instructor2.setFullName("Samir Bennis");
                instructor2.setRole(Role.MONITEUR);
                instructor2.setActive(true);
                instructor2.setCreatedAt(LocalDateTime.now());

                MoniteurProfile profile2 = new MoniteurProfile();
                profile2.setUser(instructor2);
                profile2.setPhone("0622334455");
                profile2.setCapNumber("CAP-2023-451");
                profile2.setCapExpiryDate(LocalDate.now().minusDays(5));
                profile2.setPayFrequency("WEEKLY");
                profile2.setHourlyRate(45.0);
                profile2.setFixedSalary(0.0);
                profile2.setBonusPerExamSuccess(60.0);
                moniteurProfileRepository.save(profile2);
            }

            // 2. Create Vehicles if missing
            if (vehicleRepository.count() == 0) {
                Vehicle car1 = new Vehicle();
                car1.setBrand("Peugeot");
                car1.setModel("208");
                car1.setLicensePlate("12345-A-7");
                car1.setLastTechnicalVisit(LocalDate.now().minusMonths(5));
                car1.setNextTechnicalVisit(LocalDate.now().plusMonths(7));
                car1.setInsuranceExpiryDate(LocalDate.now().plusMonths(2));
                car1.setVignetteExpiryDate(LocalDate.now().plusMonths(6));
                car1.setStatus("ACTIVE");
                car1.setCurrentMileage(48500);
                vehicleRepository.save(car1);

                Vehicle car2 = new Vehicle();
                car2.setBrand("Peugeot");
                car2.setModel("208");
                car2.setLicensePlate("98765-B-11");
                car2.setLastTechnicalVisit(LocalDate.now().minusMonths(11));
                car2.setNextTechnicalVisit(LocalDate.now().minusDays(2));
                car2.setInsuranceExpiryDate(LocalDate.now().plusMonths(1));
                car2.setVignetteExpiryDate(LocalDate.now().minusDays(15));
                car2.setStatus("ACTIVE");
                car2.setCurrentMileage(65200);
                vehicleRepository.save(car2);

                userRepository.findByUsername("youssef").ifPresent(u -> {
                    moniteurProfileRepository.findByUserId(u.getId()).ifPresent(p -> {
                        p.setActiveVehicleId(car1.getId());
                        moniteurProfileRepository.save(p);
                    });
                });
            }

            // 3. Create Candidates if missing
            if (candidateProfileRepository.count() == 0) {
                User instructor1 = userRepository.findByUsername("youssef").orElse(null);
                User instructor2 = userRepository.findByUsername("samir").orElse(null);

                User candidateUser1 = new User();
                candidateUser1.setUsername("student1");
                candidateUser1.setPassword(passwordEncoder.encode("student123"));
                candidateUser1.setEmail("amine.tazi@gmail.com");
                candidateUser1.setFullName("Amine Tazi");
                candidateUser1.setRole(Role.CANDIDATE);
                candidateUser1.setActive(true);
                candidateUser1.setCreatedAt(LocalDateTime.now().minusMonths(3));

                CandidateProfile candidateProfile1 = new CandidateProfile();
                candidateProfile1.setUser(candidateUser1);
                candidateProfile1.setCin("G741234");
                candidateProfile1.setPhone("0699887766");
                candidateProfile1.setBirthDate(LocalDate.of(2003, 5, 15));
                candidateProfile1.setRegistrationDate(LocalDate.now().minusMonths(3));
                candidateProfile1.setPermitNumber("PERMIT-998");
                candidateProfile1.setPermitExpiryDate(LocalDate.now().plusDays(25));
                candidateProfile1.setTotalAmount(3550.0);
                candidateProfile1.setAmountPaid(2000.0);
                candidateProfile1.setMaxWeeklyLessons(3);
                candidateProfile1.setAssignedMoniteur(instructor1);
                candidateProfile1.setTheoreticalTestScore(28);
                candidateProfile1.setClassesAttended(12);
                candidateProfile1.setClassesMissed(4);
                candidateProfile1.setInstructorEvaluationScore(2.5);
                candidateProfileRepository.save(candidateProfile1);

                User candidateUser2 = new User();
                candidateUser2.setUsername("student2");
                candidateUser2.setPassword(passwordEncoder.encode("student123"));
                candidateUser2.setEmail("fatima.zara@gmail.com");
                candidateUser2.setFullName("Fatima Zahra");
                candidateUser2.setRole(Role.CANDIDATE);
                candidateUser2.setActive(true);
                candidateUser2.setCreatedAt(LocalDateTime.now().minusDays(45));

                CandidateProfile candidateProfile2 = new CandidateProfile();
                candidateProfile2.setUser(candidateUser2);
                candidateProfile2.setCin("A985632");
                candidateProfile2.setPhone("0655443322");
                candidateProfile2.setBirthDate(LocalDate.of(2001, 10, 20));
                candidateProfile2.setRegistrationDate(LocalDate.now().minusDays(45));
                candidateProfile2.setPermitNumber("PERMIT-112");
                candidateProfile2.setPermitExpiryDate(LocalDate.now().plusMonths(5));
                candidateProfile2.setTotalAmount(3550.0);
                candidateProfile2.setAmountPaid(3550.0);
                candidateProfile2.setMaxWeeklyLessons(2);
                candidateProfile2.setAssignedMoniteur(instructor1);
                candidateProfile2.setNarsaExamDate(LocalDate.now().plusDays(10));
                candidateProfile2.setTheoreticalTestScore(38);
                candidateProfile2.setClassesAttended(20);
                candidateProfile2.setClassesMissed(1);
                candidateProfile2.setInstructorEvaluationScore(4.5);
                candidateProfileRepository.save(candidateProfile2);

                String[] mockNames = {
                        "Mehdi Benjelloun", "Rania Alami", "Saad Hariri", "Meriem Kadiri",
                        "Yassine Filali", "Salma Mansouri", "Anas Bennani", "Laila Jabri",
                        "Hassan Chraibi", "Khadija Idrissi", "Omar Tazi", "Soukaina Berrada",
                        "Younes Naciri", "Imane Sqalli", "Nabil Kettani", "Amina El Fassi",
                        "Tariq Lahlou", "Noura Bennis", "Reda Alaoui", "Sanaa Tahiri",
                        "Ayoub Amrani", "Bouchra Guessous", "Hamza Benali", "Hind El Amrani",
                        "Kamal Mernissi", "Meryem Iraqi", "Adil Zniber", "Zineb Benchekroun",
                        "Othmane Sefrioui", "Rita Guessous"
                };
                int[] regMonthsAgo = {
                        11, 11, 10, 10, 9, 8, 8, 7,
                        7, 6, 6, 6, 5, 5, 4, 4,
                        3, 3, 3, 2, 2, 2, 2, 1,
                        1, 1, 0, 0, 0, 0
                };
                for (int i = 0; i < mockNames.length; i++) {
                    User mockUser = new User();
                    mockUser.setUsername("mockstudent" + i);
                    mockUser.setPassword(passwordEncoder.encode("student123"));
                    mockUser.setEmail("mock" + i + "@autoecole.ma");
                    mockUser.setFullName(mockNames[i]);
                    mockUser.setRole(Role.CANDIDATE);
                    mockUser.setActive(true);
                    mockUser.setCreatedAt(LocalDateTime.now().minusMonths(regMonthsAgo[i]).minusDays(i));

                    CandidateProfile mockProf = new CandidateProfile();
                    mockProf.setUser(mockUser);
                    mockProf.setCin("X" + (100000 + i));
                    mockProf.setPhone("06" + String.format("%08d", (i + 1) * 112233));
                    mockProf.setBirthDate(LocalDate.of(1990 + (i % 15), (i % 12) + 1, (i % 28) + 1));
                    mockProf.setRegistrationDate(LocalDate.now().minusMonths(regMonthsAgo[i]).minusDays(i));
                    mockProf.setPermitNumber("PERM-" + (500 + i));
                    mockProf.setPermitExpiryDate(LocalDate.now().plusMonths((i % 6) + 1));
                    mockProf.setTotalAmount(3500.0);
                    mockProf.setAmountPaid(1000.0 * (i % 3 + 1));
                    mockProf.setMaxWeeklyLessons(3);
                    mockProf.setAssignedMoniteur(i % 2 == 0 ? instructor1 : instructor2);
                    mockProf.setTheoreticalTestScore(25 + (i % 15));
                    mockProf.setClassesAttended(10 + (i % 10));
                    mockProf.setClassesMissed(i % 5);
                    mockProf.setInstructorEvaluationScore(2.0 + (i % 3));
                    if (i % 4 == 0) {
                        mockProf.setNarsaExamDate(LocalDate.now().plusDays((i * 2) + 5));
                    }
                    candidateProfileRepository.save(mockProf);
                }
            }

            // 4. Create Caisse Transactions if missing
            if (caisseTransactionRepository.count() == 0) {
                User assistant = userRepository.findByUsername("assistant").orElse(null);
                User candidateUser1 = userRepository.findByUsername("student1").orElse(null);
                User candidateUser2 = userRepository.findByUsername("student2").orElse(null);

                if (assistant != null) {
                    if (candidateUser1 != null) {
                        CaisseTransaction t1 = new CaisseTransaction();
                        t1.setAssistant(assistant);
                        t1.setDate(LocalDateTime.now().minusMonths(3));
                        t1.setAmount(2000.0);
                        t1.setType(TransactionType.CASH);
                        t1.setCandidate(candidateUser1);
                        t1.setDescription("Avancement frais d'inscription - Amine Tazi");
                        caisseTransactionRepository.save(t1);
                    }

                    if (candidateUser2 != null) {
                        CaisseTransaction t2 = new CaisseTransaction();
                        t2.setAssistant(assistant);
                        t2.setDate(LocalDateTime.now().minusDays(45));
                        t2.setAmount(3550.0);
                        t2.setType(TransactionType.CHECK);
                        t2.setCandidate(candidateUser2);
                        t2.setDescription("Paiement complet formation - Fatima Zahra");
                        caisseTransactionRepository.save(t2);
                    }

                    List<CandidateProfile> profiles = candidateProfileRepository.findAll();
                    for (int i = 0; i < Math.min(30, profiles.size()); i++) {
                        CandidateProfile cp = profiles.get(i);
                        if (cp.getUser() != null) {
                            CaisseTransaction t = new CaisseTransaction();
                            t.setAssistant(assistant);
                            t.setDate(LocalDateTime.now().minusMonths(i % 6).minusDays(i));
                            t.setAmount(1000.0 * (i % 3 + 1));
                            t.setType(i % 4 == 0 ? TransactionType.CHECK : TransactionType.CASH);
                            t.setDescription("Avance Frais - " + cp.getUser().getFullName());
                            t.setCandidate(cp.getUser());
                            caisseTransactionRepository.save(t);
                        }
                    }
                }
            }

            // 5. Create Narsa Quotas if missing
            if (narsaQuotaRepository.count() == 0) {
                NarsaQuota q1 = new NarsaQuota();
                q1.setMonthYear(LocalDate.now().format(DateTimeFormatter.ofPattern("MM-yyyy")));
                q1.setTotalQuota(15);
                q1.setUsedQuota(1);
                narsaQuotaRepository.save(q1);

                NarsaQuota q2 = new NarsaQuota();
                q2.setMonthYear(LocalDate.now().plusMonths(1).format(DateTimeFormatter.ofPattern("MM-yyyy")));
                q2.setTotalQuota(15);
                q2.setUsedQuota(0);
                narsaQuotaRepository.save(q2);
            }

            // 6. Create Driving Lesson Slots if missing
            if (drivingLessonSlotRepository.count() == 0) {
                User candidateUser1 = userRepository.findByUsername("student1").orElse(null);
                User candidateUser2 = userRepository.findByUsername("student2").orElse(null);
                User instructor1 = userRepository.findByUsername("youssef").orElse(null);
                User instructor2 = userRepository.findByUsername("samir").orElse(null);
                List<Vehicle> vehicles = vehicleRepository.findAll();
                Vehicle car1 = vehicles.isEmpty() ? null : vehicles.get(0);
                Vehicle car2 = vehicles.size() > 1 ? vehicles.get(1) : car1;

                if (candidateUser1 != null && instructor1 != null) {
                    DrivingLessonSlot lesson1 = new DrivingLessonSlot();
                    lesson1.setCandidate(candidateUser1);
                    lesson1.setMoniteur(instructor1);
                    lesson1.setVehicle(car1);
                    lesson1.setSlotDateTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
                    lesson1.setDurationMinutes(60);
                    lesson1.setStatus(BookingStatus.BOOKED);
                    drivingLessonSlotRepository.save(lesson1);
                }

                if (candidateUser2 != null && instructor1 != null) {
                    DrivingLessonSlot lesson2 = new DrivingLessonSlot();
                    lesson2.setCandidate(candidateUser2);
                    lesson2.setMoniteur(instructor1);
                    lesson2.setVehicle(car1);
                    lesson2.setSlotDateTime(LocalDateTime.now().plusDays(2).withHour(15).withMinute(0));
                    lesson2.setDurationMinutes(60);
                    lesson2.setStatus(BookingStatus.BOOKED);
                    drivingLessonSlotRepository.save(lesson2);
                }

                List<User> students = userRepository.findAll().stream().filter(u -> u.getRole() == Role.CANDIDATE).toList();
                if (!students.isEmpty() && instructor1 != null) {
                    for (int i = 0; i < 40; i++) {
                        DrivingLessonSlot oldLesson = new DrivingLessonSlot();
                        oldLesson.setCandidate(students.get(i % students.size()));
                        oldLesson.setMoniteur(i % 2 == 0 ? instructor1 : (instructor2 != null ? instructor2 : instructor1));
                        oldLesson.setVehicle(i % 2 == 0 ? car1 : car2);
                        oldLesson.setSlotDateTime(LocalDateTime.now().minusDays(i % 30 + 1).withHour(8 + (i % 8)).withMinute(0));
                        oldLesson.setDurationMinutes(60);
                        oldLesson.setStatus(BookingStatus.COMPLETED);
                        oldLesson.setComments(i % 3 == 0 ? "Bonne maîtrise de l'embrayage." : "Doit travailler les créneaux.");
                        drivingLessonSlotRepository.save(oldLesson);
                    }
                }
            }

            // 7. Create Fuel Records if missing
            if (fuelRecordRepository.count() == 0) {
                List<Vehicle> vehicles = vehicleRepository.findAll();
                User instructor1 = userRepository.findByUsername("youssef").orElse(null);
                User instructor2 = userRepository.findByUsername("samir").orElse(null);

                if (!vehicles.isEmpty() && instructor1 != null) {
                    Vehicle car1 = vehicles.get(0);
                    String[] stations = {"Afriquia", "Total", "Shell", "Petromin", "Winxo"};
                    int odoStart1 = 45000;
                    for (int i = 0; i < 12; i++) {
                        FuelRecord fr = new FuelRecord();
                        fr.setVehicle(car1);
                        fr.setMoniteur(instructor1);
                        fr.setDate(LocalDateTime.now().minusMonths(6).plusDays(i * 15).withHour(8));
                        int kmDriven = 280 + (i % 3) * 40;
                        odoStart1 += kmDriven;
                        fr.setOdometerKm(odoStart1);
                        double liters = (5.2 + (i % 4) * 0.3) * kmDriven / 100;
                        fr.setLiters(Math.round(liters * 100.0) / 100.0);
                        fr.setPricePerLiter(13.5 + (i % 3) * 0.2);
                        fr.setTotalCost(Math.round(fr.getLiters() * fr.getPricePerLiter() * 100.0) / 100.0);
                        fr.setStation(stations[i % stations.length]);
                        fr.setNotes(i == 11 ? "Plein avant examen NARSA" : null);
                        fuelRecordRepository.save(fr);
                    }

                    if (vehicles.size() > 1 && instructor2 != null) {
                        Vehicle car2 = vehicles.get(1);
                        int odoStart2 = 62000;
                        for (int i = 0; i < 10; i++) {
                            FuelRecord fr = new FuelRecord();
                            fr.setVehicle(car2);
                            fr.setMoniteur(instructor2);
                            fr.setDate(LocalDateTime.now().minusMonths(5).plusDays(i * 16).withHour(17));
                            int kmDriven = 200 + (i % 4) * 30;
                            odoStart2 += kmDriven;
                            fr.setOdometerKm(odoStart2);
                            double baseCons = 6.5 + (i * 0.4);
                            double liters = baseCons * kmDriven / 100;
                            fr.setLiters(Math.round(liters * 100.0) / 100.0);
                            fr.setPricePerLiter(13.7 + (i % 2) * 0.15);
                            fr.setTotalCost(Math.round(fr.getLiters() * fr.getPricePerLiter() * 100.0) / 100.0);
                            fr.setStation(stations[(i + 2) % stations.length]);
                            fr.setNotes(i >= 8 ? "Consommation anormalement élevée !" : null);
                            fuelRecordRepository.save(fr);
                        }
                    }
                }
            }

            // 8. Create Pay Slips if missing
            if (paySlipRepository.count() == 0) {
                User instructor1 = userRepository.findByUsername("youssef").orElse(null);
                User instructor2 = userRepository.findByUsername("samir").orElse(null);

                if (instructor1 != null) {
                    MoniteurProfile p1 = moniteurProfileRepository.findByUserId(instructor1.getId()).orElse(null);
                    if (p1 != null) {
                        for (int month = 3; month >= 1; month--) {
                            PaySlip slip = new PaySlip();
                            slip.setMoniteur(instructor1);
                            LocalDate pStart = LocalDate.now().minusMonths(month).withDayOfMonth(1);
                            LocalDate pEnd = pStart.plusMonths(1).minusDays(1);
                            slip.setPeriodStart(pStart);
                            slip.setPeriodEnd(pEnd);
                            slip.setGeneratedAt(pEnd.atTime(18, 0));
                            int hours = 35 + (month * 3);
                            slip.setTotalHours(hours);
                            slip.setHourlyRate(p1.getHourlyRate());
                            slip.setHoursPayment(hours * p1.getHourlyRate());
                            slip.setFixedSalary(p1.getFixedSalary());
                            int exams = month == 2 ? 2 : 0;
                            slip.setExamSuccessCount(exams);
                            slip.setBonusPerExam(p1.getBonusPerExamSuccess());
                            slip.setTotalBonus(exams * p1.getBonusPerExamSuccess());
                            slip.setTotalPay(slip.getHoursPayment() + slip.getFixedSalary() + slip.getTotalBonus());
                            slip.setPayFrequency(p1.getPayFrequency());
                            slip.setStatus(month > 1 ? "PAID" : "GENERATED");
                            paySlipRepository.save(slip);
                        }
                    }
                }
            }

            // 9. Create CRM Prospects if missing
            if (prospectRepository.count() == 0) {
                Prospect p1 = new Prospect();
                p1.setFullName("Ahmad Chafik");
                p1.setPhone("0699887766");
                p1.setLicenseType("B");
                p1.setStatus(ProspectStatus.NEW);
                p1.setCreatedAt(LocalDate.now().minusDays(1));
                p1.setLastContactDate(LocalDate.now().minusDays(1));
                prospectRepository.save(p1);

                Prospect p2 = new Prospect();
                p2.setFullName("Sara Benali");
                p2.setPhone("0688776655");
                p2.setLicenseType("B");
                p2.setStatus(ProspectStatus.CALLED);
                p2.setCreatedAt(LocalDate.now().minusDays(10));
                p2.setLastContactDate(LocalDate.now().minusDays(8));
                p2.setNotes("A dit qu'elle passera avec son père la semaine dernière.");
                prospectRepository.save(p2);

                Prospect p3 = new Prospect();
                p3.setFullName("Omar Tazi");
                p3.setPhone("0677665544");
                p3.setLicenseType("C");
                p3.setStatus(ProspectStatus.WAITING_DOCS);
                p3.setCreatedAt(LocalDate.now().minusDays(3));
                p3.setLastContactDate(LocalDate.now().minusDays(2));
                p3.setNotes("Doit ramener les photos et copie CIN");
                prospectRepository.save(p3);

                Prospect p4 = new Prospect();
                p4.setFullName("Fatima Zahra");
                p4.setPhone("0611111111");
                p4.setLicenseType("B");
                p4.setStatus(ProspectStatus.ENROLLED);
                p4.setCreatedAt(LocalDate.now().minusDays(20));
                p4.setLastContactDate(LocalDate.now().minusDays(15));
                prospectRepository.save(p4);
            }

            // 10. Create Support Lessons if missing
            if (supportLessonRepository.count() == 0) {
                User cand1 = userRepository.findByUsername("student1").orElse(null);
                User cand2 = userRepository.findByUsername("student2").orElse(null);
                User mon1 = userRepository.findByUsername("youssef").orElse(null);
                List<Vehicle> vehicles = vehicleRepository.findAll();
                Vehicle veh1 = vehicles.isEmpty() ? null : vehicles.get(0);
                User assistant = userRepository.findByUsername("assistant").orElse(mon1);

                if (cand1 != null && mon1 != null) {
                    SupportLesson sl1 = new SupportLesson();
                    sl1.setCandidate(cand1);
                    sl1.setMoniteur(mon1);
                    sl1.setVehicle(veh1);
                    sl1.setSessionDate(LocalDateTime.now().minusDays(10).withHour(10));
                    sl1.setDurationMinutes(90);
                    sl1.setPricePerSession(200.0);
                    sl1.setLessonType(SupportLessonType.PREPARATION_EXAMEN);
                    sl1.setStatus(BookingStatus.COMPLETED);
                    sl1.setPaid(true);
                    sl1.setPerformanceRating(4);
                    sl1.setMoniteurFeedback("Bon niveau de confiance, manœuvres bien maîtrisées.");
                    sl1.setCreatedAt(LocalDateTime.now().minusDays(12));
                    supportLessonRepository.save(sl1);

                    if (cand2 != null) {
                        SupportLesson sl2 = new SupportLesson();
                        sl2.setCandidate(cand2);
                        sl2.setMoniteur(mon1);
                        sl2.setVehicle(veh1);
                        sl2.setSessionDate(LocalDateTime.now().minusDays(5).withHour(14));
                        sl2.setDurationMinutes(60);
                        sl2.setPricePerSession(150.0);
                        sl2.setLessonType(SupportLessonType.CRENEAU_PARKING);
                        sl2.setStatus(BookingStatus.COMPLETED);
                        sl2.setPaid(true);
                        sl2.setPerformanceRating(3);
                        sl2.setMoniteurFeedback("Le créneau doit être retravaillé, problèmes d'angles.");
                        sl2.setCreatedAt(LocalDateTime.now().minusDays(7));
                        supportLessonRepository.save(sl2);
                    }

                    SupportLesson sl3 = new SupportLesson();
                    sl3.setCandidate(cand1);
                    sl3.setMoniteur(mon1);
                    sl3.setVehicle(veh1);
                    sl3.setSessionDate(LocalDateTime.now().plusDays(2).withHour(9));
                    sl3.setDurationMinutes(120);
                    sl3.setPricePerSession(250.0);
                    sl3.setLessonType(SupportLessonType.CONDUITE_AUTOROUTE);
                    sl3.setStatus(BookingStatus.BOOKED);
                    sl3.setPaid(true);
                    sl3.setComments("Première expérience autoroute, aller doucement.");
                    sl3.setCreatedAt(LocalDateTime.now().minusDays(1));
                    supportLessonRepository.save(sl3);
                }
            }
        };
    }
}
