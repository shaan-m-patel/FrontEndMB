import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const filePath = path.join(process.cwd(), '.data', 'paid-bookings.json');

async function readAll() {
    try {
        const parsed = JSON.parse(await readFile(filePath, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

export async function savePaidBooking(record) {
    const bookings = await readAll();
    const stored = {
        id: record.id || randomUUID(),
        userEmail: record.userEmail,
        movieName: record.movieName,
        movieDate: record.movieDate || record.selectedDate,
        movieTime: record.movieTime || record.selectedTime,
        lines: record.order || [],
        orderTotal: record.orderTotal,
        paymentId: record.paymentId,
        createdAt: new Date().toISOString(),
    };
    bookings.push(stored);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(bookings), 'utf8');
    return stored;
}

export async function getPaidBookingForUser(id, email) {
    if (!id || !email) {
        return null;
    }
    const bookings = await readAll();
    const match = bookings.find((booking) => booking.id === id);
    if (!match || match.userEmail !== email) {
        return null;
    }
    return match;
}
