package com.driveshare.architecture;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(packages = "com.driveshare", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureRulesTest {

    // 1. Domain không phụ thuộc Framework (Spring, JPA, Hibernate)
    @ArchTest
    static final ArchRule domain_khong_phu_thuoc_framework =
        noClasses().that().resideInAPackage("..modules..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "org.springframework..", "jakarta.persistence..", "jakarta.validation..")
            .allowEmptyShould(true);

    // 2. Domain không phụ thuộc Application, Adapter hay Common Persistence/Adapter
    @ArchTest
    static final ArchRule domain_khong_phu_thuoc_application_hay_adapter =
        noClasses().that().resideInAPackage("..modules..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "..modules..application..", "..modules..adapter..", 
                "..common.adapter..", "..common.persistence..")
            .allowEmptyShould(true);

    // 3. Application không phụ thuộc Adapter hay Common Persistence/Adapter
    @ArchTest
    static final ArchRule application_khong_phu_thuoc_adapter =
        noClasses().that().resideInAPackage("..modules..application..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "..modules..adapter..", "..common.adapter..", "..common.persistence..")
            .allowEmptyShould(true);

    // 4. Application không phụ thuộc JPA / Hibernate / Spring Data
    @ArchTest
    static final ArchRule application_khong_phu_thuoc_jpa =
        noClasses().that().resideInAPackage("..modules..application..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "jakarta.persistence..", "org.springframework.data..")
            .allowEmptyShould(true);

    // 5. Controller Web tuyệt đối không gọi trực tiếp Persistence
    @ArchTest
    static final ArchRule controller_khong_goi_persistence =
        noClasses().that().resideInAPackage("..adapter.in.web..")
            .should().dependOnClassesThat().resideInAnyPackage("..adapter.out.persistence..")
            .allowEmptyShould(true);

    // 6. Slices Rule: Tầng Application của các module KHÔNG phụ thuộc trực tiếp vào nhau
    @ArchTest
    static final ArchRule application_cac_module_khong_phu_thuoc_nhau =
        slices().matching("..modules.(*).application..")
            .should().notDependOnEachOther()
            .allowEmptyShould(true);

    // 7. Quy tắc cách ly module: Các class đã chuyển đổi chỉ giao tiếp với module khác qua port.in, command, result
    @ArchTest
    static final ArchRule module_giao_tiep_qua_inbound_port =
        classes().that().resideInAnyPackage("..modules..application..", "..modules..adapter.in..")
            .should(tuanThuGiaoTiepModule())
            .allowEmptyShould(true);

    private static ArchCondition<JavaClass> tuanThuGiaoTiepModule() {
        return new ArchCondition<JavaClass>("chỉ được phụ thuộc module khác qua inbound ports, command, result") {
            @Override
            public void check(JavaClass item, ConditionEvents events) {
                String pkg = item.getPackageName();
                // Bỏ qua legacy adapters được miễn trừ
                if (item.getSimpleName().endsWith("LegacyAdapter")) {
                    return;
                }
                item.getDirectDependenciesFromSelf().forEach(dep -> {
                    String targetPkg = dep.getTargetClass().getPackageName();
                    if (targetPkg.contains(".modules.") && !targetPkg.startsWith(extractModulePackage(pkg))) {
                        boolean validPortAccess = targetPkg.contains(".application.port.in")
                                || targetPkg.contains(".application.command")
                                || targetPkg.contains(".application.result")
                                || targetPkg.contains(".dto."); // Cho phép DTO chung trong quá trình chuyển tiếp
                        if (!validPortAccess) {
                            String message = String.format("Vi phạm ranh giới: %s phụ thuộc trái phép vào %s",
                                    item.getName(), dep.getTargetClass().getName());
                            events.add(SimpleConditionEvent.violated(item, message));
                        }
                    }
                });
            }

            private String extractModulePackage(String fullPkg) {
                int idx = fullPkg.indexOf(".modules.");
                if (idx == -1) return fullPkg;
                int nextDot = fullPkg.indexOf('.', idx + 9);
                return nextDot == -1 ? fullPkg : fullPkg.substring(0, nextDot);
            }
        };
    }
}

