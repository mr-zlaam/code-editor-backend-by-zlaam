type TEMPLATEURL = string;
export const returnTemplateBasedOnTech = (techStack: string): TEMPLATEURL => {
  const tech = techStack.toLocaleLowerCase();
  if (tech.includes("react")) {
    return "https://github.com/SafdarJamal/vite-template-react.git";
  }
  return "";
};
