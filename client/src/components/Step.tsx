import React from "react";

const Step = () => {
  const stepData = [
    {
      id: 1,
      title: "Step 1",
      paragraph:
        "All recipes are written using certain conventions, which define the characteristics of common ingredients. The rules vary from place to place.",
    },
    {
      id: 2,
      title: "Step 2",
      paragraph:
        "All recipes are written using certain conventions, which define the characteristics of common ingredients. The rules vary from place to place.",
    },
    {
      id: 3,
      title: "Step 3",
      paragraph:
        "All recipes are written using certain conventions, which define the characteristics of common ingredients. The rules vary from place to place.",
    },
  ];
  return (
    <section className="container mx-auto my-16 px-8 lg:px-8 relative pb-12">
      <div>
        <div className="grid gap-6 row-gap-10 lg:grid-cols-2">
          <div className="lg:py-6 lg:pr-16">
            {stepData.map((step, i) => (
              <div className="flex" key={i}>
                <div className="flex flex-col items-center mr-4">
                  <div>
                    <div className="flex items-center justify-center w-10 h-10 border rounded-full">
                      <svg
                        className="w-4 text-white"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24">
                        <line
                          fill="none"
                          strokeMiterlimit="10"
                          x1="12"
                          y1="2"
                          x2="12"
                          y2="22"
                        />
                        <polyline
                          fill="none"
                          strokeMiterlimit="10"
                          points="19,15 12,22 5,15"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="w-px h-full bg-gray-300" />
                </div>
                <div className="pt-1 pb-8">
                  <p className="mb-2 text-lg font-bold">{step.title}</p>
                  <p className="text-white">{step.paragraph}</p>
                </div>
              </div>
            ))}

            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <div>
                  <div className="flex items-center justify-center w-10 h-10 border rounded-full">
                    <svg
                      className="w-6 text-white"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <polyline
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeMiterlimit="10"
                        points="6,12 10,16 18,8"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="pt-1">
                <p className="mb-2 text-lg font-bold text-white">Success</p>
                <p className="text-white" />
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              className="inset-0 object-cover object-bottom w-full rounded shadow-lg h-96 lg:absolute lg:h-full"
              src="https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&amp;cs=tinysrgb&amp;dpr=2&amp;h=750&amp;w=1260"
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Step;