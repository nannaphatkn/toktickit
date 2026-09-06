interface RequesterPromptProps {
  title?: string;
  message?: string;
}

export default function RequesterPrompt({
  title = '⚠️ Please Select a Requester',
  message = 'Please select a Development Requester from the dropdown in the navigation bar to proceed.',
}: RequesterPromptProps) {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="card-body text-center p-5">
              <h3 className="mb-3" style={{ color: 'var(--primary)' }}>{title}</h3>
              <p className="text-muted mb-4">{message}</p>
              <div className="alert alert-info" role="alert">
                👆 Use the selector in the top navigation bar to choose your identity.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
