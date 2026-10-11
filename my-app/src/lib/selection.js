export function readSelection(searchParams) {
    let selectedSeats = [];
    let ageCategories = {};
    try {
        const seats = JSON.parse(searchParams.get('selectedSeats') || '[]');
        const ages = JSON.parse(searchParams.get('ageCategories') || '{}');
        selectedSeats = Array.isArray(seats) ? seats : [];
        ageCategories = ages && typeof ages === 'object' ? ages : {};
    } catch {
        selectedSeats = [];
        ageCategories = {};
    }

    return {
        movieName: searchParams.get('movieName') || '',
        selectedDate: searchParams.get('selectedDate') || '',
        selectedTime: searchParams.get('selectedTime') || '',
        selectedSeats,
        ageCategories,
    };
}

export function selectionQuery(selection) {
    return new URLSearchParams({
        movieName: selection.movieName,
        selectedDate: selection.selectedDate,
        selectedTime: selection.selectedTime,
        selectedSeats: JSON.stringify(selection.selectedSeats),
        ageCategories: JSON.stringify(selection.ageCategories),
    }).toString();
}
