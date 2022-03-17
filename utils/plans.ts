export const getPlanName = (months: number) => {
  if (months === 1) {
    return 'Monthly'
  } else if (months === 12) {
    return 'Yearly'
  } else {
    return `${months} Months`
  }
}
