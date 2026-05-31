<template>
  <div class="step-node">
    <div class="step-icon-wrapper">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        fill="none"
        version="1.1"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="master_svg0_684_057109">
            <rect x="0" y="12" width="12" height="12" rx="0" />
          </clipPath>
        </defs>
        <g transform="matrix(1,0,0,-1,0,24)" clip-path="url(#master_svg0_684_057109)">
          <path
            d="M3.75,16.4624929C4.605840000000001,16.2887669,5.25,15.5321093,5.25,14.625C5.25,13.58946609,4.4105339,12.75,3.375,12.75C2.33946609,12.75,1.5,13.58946609,1.5,14.625C1.5,15.5321093,2.14415985,16.2887669,3,16.4624929C3,16.4624929,3,19.5375066,3,19.5375066C2.14415985,19.7112331,1.5,20.4678912,1.5,21.375C1.5,22.4105339,2.33946609,23.25,3.375,23.25C4.4105339,23.25,5.25,22.4105339,5.25,21.375C5.25,20.4678912,4.605840000000001,19.7112331,3.75,19.5375066C3.75,19.5375066,3.75,18.75,3.75,18.75C3.75,18.75,7.125,18.75,7.125,18.75C8.1605339,18.75,9,17.9105339,9,16.875C9,16.875,9,16.4624929,9,16.4624929C9.8558397,16.2887669,10.5,15.5321093,10.5,14.625C10.5,13.58946609,9.6605339,12.75,8.625,12.75C7.5894661,12.75,6.75,13.58946609,6.75,14.625C6.75,15.5321093,7.3941603,16.2887669,8.25,16.4624929C8.25,16.4624929,8.25,16.875,8.25,16.875C8.25,17.4963207,7.7463198,18,7.125,18C7.125,18,3.75,18,3.75,18C3.75,18,3.75,16.4624929,3.75,16.4624929ZM3.375,15.75C2.7536798,15.75,2.25,15.2463202,2.25,14.625C2.25,14.0036798,2.7536798,13.5,3.375,13.5C3.9963202,13.5,4.5,14.0036798,4.5,14.625C4.5,15.2463202,3.9963202,15.75,3.375,15.75ZM8.625,15.75C8.0036793,15.75,7.5,15.2463202,7.5,14.625C7.5,14.0036798,8.0036793,13.5,8.625,13.5C9.2463207,13.5,9.75,14.0036798,9.75,14.625C9.75,15.2463202,9.2463207,15.75,8.625,15.75ZM4.5,21.375C4.5,21.9963207,3.9963202,22.5,3.375,22.5C2.7536798,22.5,2.25,21.9963207,2.25,21.375C2.25,20.7536793,2.7536798,20.25,3.375,20.25C3.9963202,20.25,4.5,20.7536793,4.5,21.375Z"
            fill="#4E5969"
            fill-opacity="1"
          />
        </g>
      </svg>
    </div>
    <span class="step-text">{{ stepName }}</span>
  </div>
</template>

<script>
export default {
  name: 'StepNode',
  props: {
    stepName: {
      type: String,
      required: true,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
.step-node {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px;
  background: var(--hatech-base-fill-color-nav-hover);
  border-radius: 100px;
  color: var(--hatech-base-font-color-secondary-text);
  margin: 4px 0;
  border: 1px solid var(--hatech-base-fill-color-normal);

  .step-icon-wrapper {
    width: 16px;
    height: 16px;
    background: linear-gradient(
      180deg,
      var(--hatech-base-background-color) 6%,
      var(--hatech-base-border-color-middle) 73%
    );
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 1px solid var(--hatech-base-fill-color-hover);

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .step-text {
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
  }
}
</style>
