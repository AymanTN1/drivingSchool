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

@SpringBootApplication
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
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (userRepository.count() == 0) {
                // 1. Create Director (Admin)
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@autoecolekarima.ma");
                admin.setFullName("Chakib (Directeur)");
                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                admin.setCreatedAt(LocalDateTime.now());
                userRepository.save(admin);

                // 2. Create Assistant
                User assistant = new User();
                assistant.setUsername("assistant");
                assistant.setPassword(passwordEncoder.encode("assistant123"));
                assistant.setEmail("assistant@autoecolekarima.ma");
                assistant.setFullName("Karima (Assistant)");
                assistant.setRole(Role.ASSISTANT);
                assistant.setActive(true);
                assistant.setCreatedAt(LocalDateTime.now());
                userRepository.save(assistant);

                // 3. Create Moniteurs
                User instructor1 = new User();
                instructor1.setUsername("youssef");
                instructor1.setPassword(passwordEncoder.encode("youssef123"));
                instructor1.setEmail("youssef.moniteur@gmail.com");
                instructor1.setFullName("Youssef El Alami");
                instructor1.setRole(Role.MONITEUR);
                instructor1.setActive(true);
                instructor1.setCreatedAt(LocalDateTime.now());
                // Removed manual save since it's cascaded via MoniteurProfile

                User instructor2 = new User();
                instructor2.setUsername("samir");
                instructor2.setPassword(passwordEncoder.encode("samir123"));
                instructor2.setEmail("samir.moniteur@gmail.com");
                instructor2.setFullName("Samir Bennis");
                instructor2.setRole(Role.MONITEUR);
                instructor2.setActive(true);
                instructor2.setCreatedAt(LocalDateTime.now());
                // Removed manual save since it's cascaded via MoniteurProfile

                // Create Moniteur Profiles
                MoniteurProfile profile1 = new MoniteurProfile();
                profile1.setUser(instructor1);
                profile1.setPhone("0611223344");
                profile1.setCapNumber("CAP-2024-887");
                profile1.setCapExpiryDate(LocalDate.now().plusMonths(8)); // Expiry in 8 months
                moniteurProfileRepository.save(profile1);

                MoniteurProfile profile2 = new MoniteurProfile();
                profile2.setUser(instructor2);
                profile2.setPhone("0622334455");
                profile2.setCapNumber("CAP-2023-451");
                profile2.setCapExpiryDate(LocalDate.now().minusDays(5)); // Expiry past, for warnings testing!
                moniteurProfileRepository.save(profile2);

                // 4. Create Vehicles
                Vehicle car1 = new Vehicle();
                car1.setBrand("Peugeot");
                car1.setModel("208");
                car1.setLicensePlate("12345-A-7");
                car1.setLastTechnicalVisit(LocalDate.now().minusMonths(5));
                car1.setNextTechnicalVisit(LocalDate.now().plusMonths(7));
                car1.setInsuranceExpiryDate(LocalDate.now().plusMonths(2));
                car1.setVignetteExpiryDate(LocalDate.now().plusMonths(6));
                car1.setStatus("ACTIVE");
                vehicleRepository.save(car1);

                Vehicle car2 = new Vehicle();
                car2.setBrand("Peugeot");
                car2.setModel("208");
                car2.setLicensePlate("98765-B-11");
                car2.setLastTechnicalVisit(LocalDate.now().minusMonths(11));
                car2.setNextTechnicalVisit(LocalDate.now().minusDays(2)); // Alerts testing! (technical visit expired)
                car2.setInsuranceExpiryDate(LocalDate.now().plusMonths(1));
                car2.setVignetteExpiryDate(LocalDate.now().minusDays(15)); // Vignette expired!
                car2.setStatus("ACTIVE");
                vehicleRepository.save(car2);

                // Assign car1 to instructor 1
                profile1.setActiveVehicleId(car1.getId());
                moniteurProfileRepository.save(profile1);

                // 5. Create Candidates
                User candidateUser1 = new User();
                candidateUser1.setUsername("student1");
                candidateUser1.setPassword(passwordEncoder.encode("student123"));
                candidateUser1.setEmail("amine.tazi@gmail.com");
                candidateUser1.setFullName("Amine Tazi");
                candidateUser1.setRole(Role.CANDIDATE);
                candidateUser1.setActive(true);
                candidateUser1.setCreatedAt(LocalDateTime.now().minusMonths(3));
                // Removed manual save since it's cascaded via CandidateProfile

                CandidateProfile candidateProfile1 = new CandidateProfile();
                candidateProfile1.setUser(candidateUser1);
                candidateProfile1.setCin("G741234");
                candidateProfile1.setPhone("0699887766");
                candidateProfile1.setBirthDate(LocalDate.of(2003, 5, 15));
                candidateProfile1.setRegistrationDate(LocalDate.now().minusMonths(3));
                candidateProfile1.setPermitNumber("PERMIT-998");
                candidateProfile1.setPermitExpiryDate(LocalDate.now().plusDays(25)); // Warning expiring soon (less than 30 days)
                candidateProfile1.setTotalAmount(3550.0);
                candidateProfile1.setAmountPaid(2000.0); // outstanding balance = 1550 DH
                candidateProfile1.setMaxWeeklyLessons(3);
                candidateProfile1.setAssignedMoniteur(instructor1);
                candidateProfileRepository.save(candidateProfile1);

                User candidateUser2 = new User();
                candidateUser2.setUsername("student2");
                candidateUser2.setPassword(passwordEncoder.encode("student123"));
                candidateUser2.setEmail("fatima.zara@gmail.com");
                candidateUser2.setFullName("Fatima Zahra");
                candidateUser2.setRole(Role.CANDIDATE);
                candidateUser2.setActive(true);
                candidateUser2.setCreatedAt(LocalDateTime.now().minusDays(45));
                // Removed manual save since it's cascaded via CandidateProfile

                CandidateProfile candidateProfile2 = new CandidateProfile();
                candidateProfile2.setUser(candidateUser2);
                candidateProfile2.setCin("A985632");
                candidateProfile2.setPhone("0655443322");
                candidateProfile2.setBirthDate(LocalDate.of(2001, 10, 20));
                candidateProfile2.setRegistrationDate(LocalDate.now().minusDays(45));
                candidateProfile2.setPermitNumber("PERMIT-112");
                candidateProfile2.setPermitExpiryDate(LocalDate.now().plusMonths(5));
                candidateProfile2.setTotalAmount(3550.0);
                candidateProfile2.setAmountPaid(3550.0); // Fully paid
                candidateProfile2.setMaxWeeklyLessons(2);
                candidateProfile2.setAssignedMoniteur(instructor1);
                candidateProfile2.setNarsaExamDate(LocalDate.now().plusDays(10)); // Exam scheduled!
                candidateProfileRepository.save(candidateProfile2);

                // Add many more mock candidates with different registration dates over the past year to populate the analytics chart realistically
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
                    // Removed manual save since it's cascaded via CandidateProfile

                    CandidateProfile mockProf = new CandidateProfile();
                    mockProf.setUser(mockUser);
                    mockProf.setCin("X" + (100000 + i));
                    mockProf.setPhone("06" + String.format("%08d", i * 112233));
                    mockProf.setBirthDate(LocalDate.of(1990 + (i % 15), (i % 12) + 1, (i % 28) + 1));
                    mockProf.setRegistrationDate(LocalDate.now().minusMonths(regMonthsAgo[i]).minusDays(i));
                    mockProf.setPermitNumber("PERM-" + (500 + i));
                    mockProf.setPermitExpiryDate(LocalDate.now().plusMonths((i % 6) + 1));
                    mockProf.setTotalAmount(3500.0);
                    mockProf.setAmountPaid(1000.0 * (i % 3 + 1));
                    mockProf.setMaxWeeklyLessons(3);
                    mockProf.setAssignedMoniteur(i % 2 == 0 ? instructor1 : instructor2);
                    if (i % 4 == 0) {
                        mockProf.setNarsaExamDate(LocalDate.now().plusDays((i * 2) + 5)); // Some future exams
                    }
                    candidateProfileRepository.save(mockProf);
                }

                // 6. Create Caisse Transactions
                CaisseTransaction t1 = new CaisseTransaction();
                t1.setAssistant(assistant);
                t1.setDate(LocalDateTime.now().minusMonths(3));
                t1.setAmount(2000.0);
                t1.setType(TransactionType.CASH);
                t1.setCandidate(candidateUser1);
                t1.setDescription("Avancement frais d'inscription - Amine Tazi");
                caisseTransactionRepository.save(t1);

                CaisseTransaction t2 = new CaisseTransaction();
                t2.setAssistant(assistant);
                t2.setDate(LocalDateTime.now().minusDays(45));
                t2.setAmount(3550.0);
                t2.setType(TransactionType.CHECK);
                t2.setCandidate(candidateUser2);
                t2.setDescription("Paiement complet formation - Fatima Zahra");
                caisseTransactionRepository.save(t2);

                // Add details of caisse for other mock users
                for (int i = 0; i < mockNames.length; i++) {
                    CaisseTransaction t = new CaisseTransaction();
                    t.setAssistant(assistant);
                    t.setDate(LocalDateTime.now().minusMonths(regMonthsAgo[i]).minusDays(i));
                    t.setAmount(1000.0 * (i % 3 + 1));
                    t.setType(i % 4 == 0 ? TransactionType.CHECK : TransactionType.CASH);
                    t.setDescription("Avance Frais - " + mockNames[i]);
                    t.setCandidate(userRepository.findByUsername("mockstudent" + i).orElse(null));
                    caisseTransactionRepository.save(t);
                    
                    // If they paid more than 1000, let's add a second payment later
                    if ((i % 3 + 1) > 1) {
                        CaisseTransaction reliquatTransaction = new CaisseTransaction();
                        reliquatTransaction.setAssistant(assistant);
                        reliquatTransaction.setDate(LocalDateTime.now().minusMonths(regMonthsAgo[i] / 2).minusDays(i / 2));
                        reliquatTransaction.setAmount(1000.0 * ((i % 3 + 1) - 1));
                        reliquatTransaction.setType(TransactionType.CASH);
                        reliquatTransaction.setDescription("Paiement Reliquat - " + mockNames[i]);
                        reliquatTransaction.setCandidate(userRepository.findByUsername("mockstudent" + i).orElse(null));
                        caisseTransactionRepository.save(reliquatTransaction);
                    }
                }

                // 7. Create Narsa Quotas for current and next month
                NarsaQuota q1 = new NarsaQuota();
                q1.setMonthYear(LocalDate.now().format(DateTimeFormatter.ofPattern("MM-yyyy")));
                q1.setTotalQuota(15);
                q1.setUsedQuota(1); // Fatima Zahra occupies 1
                narsaQuotaRepository.save(q1);

                NarsaQuota q2 = new NarsaQuota();
                q2.setMonthYear(LocalDate.now().plusMonths(1).format(DateTimeFormatter.ofPattern("MM-yyyy")));
                q2.setTotalQuota(15);
                q2.setUsedQuota(0);
                narsaQuotaRepository.save(q2);

                // 8. Learning PC Slots - Create some booked and active slots
                // Let's assume some PC stations are currently occupied (real-time demo!)
                LocalDateTime today = LocalDateTime.now();
                
                // Let's create some learning post slots for today (some completed, some active now, some upcoming)
                // We'll occupy posts 2, 4, 7, 9, 12, 14 (total 6 posts occupied)
                int[] occupiedPosts = {2, 4, 7, 9, 12, 14};
                for (int i = 0; i < occupiedPosts.length; i++) {
                    LearningPostSlot pcSlot = new LearningPostSlot();
                    pcSlot.setCandidate(candidateUser1);
                    pcSlot.setPostNumber(occupiedPosts[i]);
                    pcSlot.setSlotDateTime(LocalDateTime.of(today.getYear(), today.getMonth(), today.getDayOfMonth(), today.getHour(), 0));
                    pcSlot.setDurationMinutes(60);
                    pcSlot.setStatus(BookingStatus.BOOKED);
                    learningPostSlotRepository.save(pcSlot);
                }

                // Add historical PC bookings for reports
                for (int i = 0; i < 80; i++) {
                    LearningPostSlot oldPcSlot = new LearningPostSlot();
                    User randomStudent = userRepository.findByUsername("mockstudent" + (i % 30)).orElse(candidateUser1);
                    oldPcSlot.setCandidate(randomStudent);
                    oldPcSlot.setPostNumber((i % 15) + 1);
                    oldPcSlot.setSlotDateTime(LocalDateTime.now().minusDays(i % 25 + 1).withHour(9 + (i % 8)).withMinute(0));
                    oldPcSlot.setDurationMinutes(60);
                    oldPcSlot.setStatus(BookingStatus.COMPLETED);
                    learningPostSlotRepository.save(oldPcSlot);
                }

                // 9. Driving Lesson Slots
                DrivingLessonSlot lesson1 = new DrivingLessonSlot();
                lesson1.setCandidate(candidateUser1);
                lesson1.setMoniteur(instructor1);
                lesson1.setVehicle(car1);
                lesson1.setSlotDateTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
                lesson1.setDurationMinutes(60);
                lesson1.setStatus(BookingStatus.BOOKED);
                drivingLessonSlotRepository.save(lesson1);

                DrivingLessonSlot lesson2 = new DrivingLessonSlot();
                lesson2.setCandidate(candidateUser2);
                lesson2.setMoniteur(instructor1);
                lesson2.setVehicle(car1);
                lesson2.setSlotDateTime(LocalDateTime.now().plusDays(2).withHour(15).withMinute(0));
                lesson2.setDurationMinutes(60);
                lesson2.setStatus(BookingStatus.BOOKED);
                drivingLessonSlotRepository.save(lesson2);

                // Add some completed driving slots to calculate weekly load
                for (int i = 0; i < 100; i++) {
                    DrivingLessonSlot oldLesson = new DrivingLessonSlot();
                    User randomStudent = userRepository.findByUsername("mockstudent" + (i % 30)).orElse(candidateUser1);
                    oldLesson.setCandidate(randomStudent);
                    oldLesson.setMoniteur(i % 2 == 0 ? instructor1 : instructor2);
                    oldLesson.setVehicle(i % 2 == 0 ? car1 : car2);
                    oldLesson.setSlotDateTime(LocalDateTime.now().minusDays(i % 30 + 1).withHour(8 + (i % 8)).withMinute(0));
                    oldLesson.setDurationMinutes(60);
                    oldLesson.setStatus(BookingStatus.COMPLETED);
                    oldLesson.setComments(i % 3 == 0 ? "Bonne maîtrise de l'embrayage." : "Doit travailler les créneaux.");
                    drivingLessonSlotRepository.save(oldLesson);
                }

                // 10. Fuel Records - Realistic fuel data for demo dashboards
                String[] stations = {"Afriquia", "Total", "Shell", "Petromin", "Winxo"};
                // Car 1 (12345-A-7): Efficient driving, avg ~5.5 L/100km
                int odoStart1 = 45000;
                for (int i = 0; i < 12; i++) {
                    FuelRecord fr = new FuelRecord();
                    fr.setVehicle(car1);
                    fr.setMoniteur(instructor1);
                    fr.setDate(LocalDateTime.now().minusMonths(6).plusDays(i * 15).withHour(8));
                    int kmDriven = 280 + (i % 3) * 40; // ~280-360 km per fill
                    odoStart1 += kmDriven;
                    fr.setOdometerKm(odoStart1);
                    double liters = (5.2 + (i % 4) * 0.3) * kmDriven / 100; // ~5.2-6.4 L/100km
                    fr.setLiters(Math.round(liters * 100.0) / 100.0);
                    fr.setPricePerLiter(13.5 + (i % 3) * 0.2); // ~13.5-13.9 DH/L
                    fr.setTotalCost(Math.round(fr.getLiters() * fr.getPricePerLiter() * 100.0) / 100.0);
                    fr.setStation(stations[i % stations.length]);
                    fr.setNotes(i == 11 ? "Plein avant examen NARSA" : null);
                    fuelRecordRepository.save(fr);
                }

                // Car 2 (98765-B-11): Higher consumption, simulates alert! ~7-9 L/100km
                int odoStart2 = 62000;
                for (int i = 0; i < 10; i++) {
                    FuelRecord fr = new FuelRecord();
                    fr.setVehicle(car2);
                    fr.setMoniteur(instructor2);
                    fr.setDate(LocalDateTime.now().minusMonths(5).plusDays(i * 16).withHour(17));
                    int kmDriven = 200 + (i % 4) * 30;
                    odoStart2 += kmDriven;
                    fr.setOdometerKm(odoStart2);
                    // Simulate increasing consumption (possible problem)
                    double baseCons = 6.5 + (i * 0.4); // Goes from 6.5 to 10.1 L/100km
                    double liters = baseCons * kmDriven / 100;
                    fr.setLiters(Math.round(liters * 100.0) / 100.0);
                    fr.setPricePerLiter(13.7 + (i % 2) * 0.15);
                    fr.setTotalCost(Math.round(fr.getLiters() * fr.getPricePerLiter() * 100.0) / 100.0);
                    fr.setStation(stations[(i + 2) % stations.length]);
                    fr.setNotes(i >= 8 ? "Consommation anormalement élevée !" : null);
                    fuelRecordRepository.save(fr);
                }
            }
        };
    }
}
