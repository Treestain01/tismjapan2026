export const editMessages = {
  // Page
  pageTitle: 'Edit Itinerary',
  pageSubtitle: 'Update the details below.',

  // Edit trigger (on ItineraryPage day cards)
  editButtonLabel: 'Edit',
  editDayAriaLabel: 'Edit this itinerary day',

  // Form mode indicator
  editingBadgePrefix: 'Editing Day',

  // Submit
  submitButton: 'Save Changes',
  submitting: 'Saving…',

  // Toast
  successToast: 'Changes saved!',
  errorToast: 'Something went wrong. Please try again.',

  // Form section labels
  dayInfoLabel: 'Day Information',
  locationsLabel: 'Locations',
  locationLabel: 'Location',

  // Not found state
  notFoundTitle: 'Day not found',
  notFoundDescription: 'This itinerary day does not exist.',
  backToItinerary: 'Back to Itinerary',
} as const;
