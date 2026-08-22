import { checkParcelBadges } from '../apps/Parcel/ParcelStore';
import type { ParcelRecord } from '../apps/Parcel/ParcelStore';
import type { Card, AutoTransfer } from '../apps/Finance/FinanceStore';
import type { FamilyMember } from '../apps/Health/hooks/useHealthData';

export interface AppNotification {
  id: string;
  text: string;
  isRead: boolean;
  appId: string;
}

export async function gatherAllNotifications(): Promise<AppNotification[]> {
  const notifications: AppNotification[] = [];
  const today = new Date();
  
  // 1. Parcels
  try {
    const arrivals = await checkParcelBadges();
    arrivals.forEach((p: ParcelRecord) => {
      notifications.push({
        id: `parcel-${p.id}`,
        text: `📦 [${p.itemName}] 택배가 오늘 도착할 예정입니다!`,
        isRead: false,
        appId: 'app-delivery'
      });
    });
  } catch (e) { console.error(e); }

  // 2. Finance (Payments & AutoTransfers)
  try {
    const rawFinance = localStorage.getItem('simplanner_finance_data');
    if (rawFinance) {
      const financeData = JSON.parse(rawFinance);
      const cards = financeData.cards || [];
      const transfers = financeData.autoTransfers || [];
      
      const currentDay = today.getDate();
      
      cards.forEach((c: Card) => {
        if (c.paymentDate) {
          const diff = c.paymentDate - currentDay;
          if (diff >= 0 && diff <= 3) {
            notifications.push({
              id: `finance-card-${c.id}`,
              text: `💳 [${c.name}] 결제일이 ${diff === 0 ? '오늘입니다' : `${diff}일 남았습니다`}.`,
              isRead: false,
              appId: 'app-card'
            });
          }
        }
      });
      
      transfers.forEach((t: AutoTransfer) => {
        if (t.paymentDate) {
          const diff = t.paymentDate - currentDay;
          if (diff >= 0 && diff <= 3) {
            notifications.push({
              id: `finance-transfer-${t.id}`,
              text: `💸 [${t.name}] 자동이체일이 ${diff === 0 ? '오늘입니다' : `${diff}일 남았습니다`}.`,
              isRead: false,
              appId: 'app-card'
            });
          }
        }
      });
    }
  } catch (e) { console.error(e); }

  // 3. CarLedger (Insurance & Inspection)
  try {
    const rawCar = localStorage.getItem('simplanner_car_ledger_data');
    if (rawCar) {
      const carData = JSON.parse(rawCar);
      const vehicles = carData.vehicles || [];
      
      vehicles.forEach((v: any) => {
        if (v.insuranceDate) {
          const insDate = new Date(v.insuranceDate);
          const daysLeft = Math.ceil((insDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft >= 0 && daysLeft <= 7) {
            notifications.push({
              id: `car-ins-${v.id}`,
              text: `🚗 [${v.name}] 자동차 보험 만기일이 ${daysLeft === 0 ? '오늘입니다' : `${daysLeft}일 남았습니다`}.`,
              isRead: false,
              appId: 'app-car'
            });
          }
        }
        if (v.inspectionDate) {
          const inspDate = new Date(v.inspectionDate);
          const daysLeft = Math.ceil((inspDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft >= 0 && daysLeft <= 7) {
            notifications.push({
              id: `car-insp-${v.id}`,
              text: `🚙 [${v.name}] 정기검사 마감일이 ${daysLeft === 0 ? '오늘입니다' : `${daysLeft}일 남았습니다`}.`,
              isRead: false,
              appId: 'app-car'
            });
          }
        }
      });
    }
  } catch (e) { console.error(e); }

  // 4. Family Birthdays (Planner)
  try {
    const rawBirthdays = localStorage.getItem('simplanner_family_birthdays');
    if (rawBirthdays) {
      const birthdays = JSON.parse(rawBirthdays);
      birthdays.forEach((b: { id: string, name: string, date: string }) => {
        const [month, day] = b.date.split('-').map(Number);
        const bDate = new Date(today.getFullYear(), month - 1, day);
        if (bDate.getTime() < today.getTime() - 24 * 60 * 60 * 1000) {
          bDate.setFullYear(today.getFullYear() + 1);
        }
        const daysLeft = Math.ceil((bDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 7) {
          notifications.push({
            id: `birthday-${b.id}`,
            text: `🎂 [${b.name}] 생일이 ${daysLeft === 0 ? '오늘입니다!' : `${daysLeft}일 남았습니다.`}`,
            isRead: false,
            appId: 'app-planner'
          });
        }
      });
    }
  } catch (e) { console.error(e); }

  // 5. School Meal Allergies (School + Health)
  try {
    const rawHealth = localStorage.getItem('simplanner_health_data');
    if (rawHealth) {
      const members = JSON.parse(rawHealth);
      const userAllergies = new Set<string>();
      members.forEach((m: FamilyMember) => {
        if (m.allergies) {
          m.allergies.forEach(a => userAllergies.add(a.trim()));
        }
      });

      if (userAllergies.size > 0) {
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('simplanner_school_meal_')) {
            const rawMeals = localStorage.getItem(key);
            if (rawMeals) {
              const mealsObj = JSON.parse(rawMeals);
              if (mealsObj && mealsObj[dateStr]) {
                const todaysMeal = mealsObj[dateStr].join(' ');
                
                const foundAllergies: string[] = [];
                userAllergies.forEach(a => {
                  if (a && todaysMeal.includes(a)) {
                    foundAllergies.push(a);
                  }
                });

                if (foundAllergies.length > 0) {
                  notifications.push({
                    id: `allergy-${dateStr}`,
                    text: `⚠️ 오늘 급식에 주의해야 할 알러지 물질(${foundAllergies.join(', ')})이 포함되어 있습니다.`,
                    isRead: false,
                    appId: 'app-meals'
                  });
                }
                break;
              }
            }
          }
        }
      }
    }
  } catch (e) { console.error(e); }

  return notifications;
}
