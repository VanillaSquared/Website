export function getBugStatusCheckmarkProps(bug) {
  if (bug?.status === "Fixed" || bug?.status === "Works as intended") {
    return { checked: true, variant: "green", icon: "check" };
  }

  if (bug?.status === "Unconfirmed") {
    return { checked: false, variant: "unconfirmed", icon: "dash" };
  }

  return { checked: false, variant: "red", icon: "x" };
}
