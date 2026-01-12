export interface Club {
  userid: string
  clubname: string
  clubaddress: string
}

export function filterClubs(clubs: Club[], searchQuery: string): Club[] {
  return clubs.filter(club =>
    club.clubname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.clubaddress.toLowerCase().includes(searchQuery.toLowerCase())
  )
}
