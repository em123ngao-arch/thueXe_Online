# -*- coding: utf-8 -*-
import sys

def patch_trip_tracker():
    with open('frontend/js/trip-tracker.js', 'r', encoding='utf-8') as f:
        content = f.read()

    target1 = "const id = rental.rental_id || rental.rentalId || rental.id || 'N/A';"
    replace1 = """const id = rental.rental_id || rental.rentalId || rental.id || 'N/A';
    const isDemoOverdue = (String(id) === '9' || String(id) === '9992');"""

    if target1 in content and 'const isDemoOverdue' not in content:
        content = content.replace(target1, replace1)

    content = content.replace(
        "const status = (rental.status || 'IN_PROGRESS').toUpperCase();",
        "const status = isDemoOverdue ? 'OVERDUE' : (rental.status || 'IN_PROGRESS').toUpperCase();"
    )
    content = content.replace(
        "let isOverdue = (status === 'OVERDUE');",
        "let isOverdue = (status === 'OVERDUE') || isDemoOverdue;"
    )
    content = content.replace(
        "const endDateTime = new Date(`${endDate}T20:00:00`);",
        "const endDateTime = isDemoOverdue ? new Date(Date.now() - 6 * 3600 * 1000 - 15 * 60 * 1000) : new Date(`${endDate}T20:00:00`);"
    )
    content = content.replace(
        "let overdueHours = Number(rental.overdue_hours || rental.overdueHours || 0);",
        "let overdueHours = Number(rental.overdue_hours || rental.overdueHours || (isDemoOverdue ? 6 : 0));"
    )
    content = content.replace(
        "let penaltyFee = Number(rental.penalty_fee || rental.penaltyFee || 0);",
        "let penaltyFee = Number(rental.penalty_fee || rental.penaltyFee || (isDemoOverdue ? 562500 : 0));"
    )
    content = content.replace(
        "const targetDate = new Date(`${endDateStr}T20:00:00`);",
        """const isDemoOverdueTimer = (String(rental?.rental_id || rental?.rentalId || rental?.id) === '9' || String(rental?.rental_id || rental?.rentalId || rental?.id) === '9992');
    const targetDate = isDemoOverdueTimer ? new Date(Date.now() - 6 * 3600 * 1000 - 15 * 60 * 1000) : new Date(`${endDateStr}T20:00:00`);"""
    )

    with open('frontend/js/trip-tracker.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("trip-tracker.js patched successfully!")

def patch_owner():
    with open('frontend/js/owner.js', 'r', encoding='utf-8') as f:
        content = f.read()

    target = "this.ownerBookings = bookings;"
    replace = """this.ownerBookings = (Array.isArray(bookings) ? bookings : []).map(b => {
          if (String(b.rental_id || b.rentalId || b.id) === '9') {
            return { ...b, status: 'OVERDUE', overdueHours: 6, penaltyFee: 562500 };
          }
          return b;
        });"""
    if target in content:
        content = content.replace(target, replace)

    with open('frontend/js/owner.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("owner.js patched successfully!")

def patch_admin():
    with open('frontend/js/admin.js', 'r', encoding='utf-8') as f:
        content = f.read()

    target_badge = "case 'DISPUTED':"
    replace_badge = """case 'OVERDUE':
        return `<span class="mioto-status-badge status-overdue" style="${baseStyle} background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; animation: pulseOverdue 1.2s infinite;"><i class="fa-solid fa-triangle-exclamation"></i> ⚠️ Quá hạn trả xe</span>`;
      case 'DISPUTED':"""

    if target_badge in content and "case 'OVERDUE':" not in content:
        content = content.replace(target_badge, replace_badge)

    target_bookings = "this.cachedBookings = json?.data || json?.result || [];"
    replace_bookings = """this.cachedBookings = (json?.data || json?.result || []).map(b => {
          if (String(b.id || b.rentalId) === '9') {
            return { ...b, status: 'OVERDUE', overdueHours: 6, penaltyFee: 562500 };
          }
          return b;
        });"""

    if target_bookings in content:
        content = content.replace(target_bookings, replace_bookings)

    with open('frontend/js/admin.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("admin.js patched successfully!")

if __name__ == '__main__':
    patch_trip_tracker()
    patch_owner()
    patch_admin()
